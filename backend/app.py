from django.template import engines
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session, joinedload
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
import random
import string
import smtplib
from email.mime.text import MIMEText


# ------------------------------------------------------------------------------------------------------------------------

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------------------------------------------------------------------------------------

# Configuration and Secret Key
SECRET_KEY = "sigma" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10

# ----------------------------------------------------------------------------------------------------------------------------------------------------------

# Database Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./clinic_fastapi.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# -----------------------------------------------------------------------------------------------------------------------------------------------------------

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)

    def verify_password(self, password: str):
        return pwd_context.verify(password, self.password_hash)

    def set_password(self, password: str):
        self.password_hash = pwd_context.hash(password)

class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)

class DoctorLogin(Base):
    __tablename__ = "doctor_logins"
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    appointment_time = Column(String)
    status = Column(String)
    doctor = relationship("Doctor")

class QueueItem(Base):
    __tablename__ = "queue"
    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, index=True)
    queue_number = Column(Integer)
    status = Column(String)

Base.metadata.create_all(bind=engine)

# ------------------------------------------------------------------------------------------------------------------------------------------

#signin class   
class UserRegister(BaseModel):
    username: str
    password: str

class DoctorRegister(BaseModel):
    username: str
    password: str

#login class
class LoginData(BaseModel):
    username: str
    password: str

# Pydantic Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

# Login Table Schema
class DoctorCreate(BaseModel):
    name: str
    specialization: str
    gender: str
    # location: str
    email: EmailStr

class DoctorUpdate(BaseModel):
    name: str | None = None
    specialization: str | None = None
    gender: str | None = None
    # location: str | None = None
    email: EmailStr | None = None

class AppointmentCreate(BaseModel):
    patient_name: str
    doctor_id: int
    appointment_time: str

class AppointmentUpdate(BaseModel):
    patient_name: str | None = None
    doctor_id: int | None = None
    appointment_time: str | None = None
    status: str | None = None

class QueueCreate(BaseModel):
    patient_name: str

class QueueUpdate(BaseModel):
    status: str

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



# -----------------------------------------------------------------------------------------------------------------------------------------------------------

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#Auth helpers
doctor_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="doctor/login")
frontdesk_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="frontdesk/login")

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Generate JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password, hashed_password):
    """Verify if entered password matches the hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

# -------------------------------------------------------------------------------------------------------------------------------------------------------

#Doctor Login API
@app.post("/doctor/login")
def doctor_login(form_data: DoctorRegister, db: Session = Depends(get_db)):
    """Authenticate doctor and return JWT token with their name."""
    
    # ✅ Find the doctor in the `DoctorLogin` table
    doctor_login = db.query(DoctorLogin).filter(DoctorLogin.username == form_data.username).first()

    if not doctor_login or not verify_password(form_data.password, doctor_login.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ✅ Fetch the actual doctor details from the `Doctor` table
    doctor = db.query(Doctor).filter(Doctor.id == doctor_login.doctor_id).first()

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    # ✅ Generate JWT token
    access_token = create_access_token(data={"sub": doctor_login.username, "role": "doctor"})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "doctor_name": doctor.name,  # ✅ Return doctor's name
        "doctor_id": doctor.id  # ✅ Return doctor's ID (useful for frontend)
    }


def get_current_doctor(token: str = Depends(doctor_oauth2_scheme), db: Session = Depends(get_db)):
    """Decode JWT and get the currently logged-in doctor."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None or payload.get("role") != "doctor":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    doctor = db.query(DoctorLogin).filter(DoctorLogin.username == username).first()
    if doctor is None:
        raise credentials_exception

    return doctor

# --------------------------------------------------------------------------------------------------------------------------------------------------

#Front Desk Login API
@app.post("/frontdesk/login")
def login_for_access_token(form_data: UserRegister, db: Session = Depends(get_db)):
    """Authenticate front desk user and return JWT token."""
    try:
        user = db.query(User).filter(User.username == form_data.username).first()
        if not user:
            raise HTTPException(status_code=400, detail="User not found")
        if not user.verify_password(form_data.password):
            raise HTTPException(status_code=400, detail="Incorrect password")
        
        # ✅ Ensure role is added to JWT token
        access_token = create_access_token(
            data={"sub": user.username, "role": "frontdesk"},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


def get_current_frontdesk_user(token: str = Depends(frontdesk_oauth2_scheme), db: Session = Depends(get_db)):
    """Decode JWT and authenticate front desk user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")  # ✅ Ensure role is extracted
        if username is None or role != "frontdesk":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception

    return user



# ---------------------------------------------------------------------------------------------------------------------------------------------------------------

#Signin Api endpoint for frontdesk
@app.post("/register", status_code=201)
def register_user(user: UserRegister, db: Session = Depends(get_db)):
    # Check if the user already exists
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(
            status_code=400, 
            detail="Username already registered"
        )
    # Create a new user and hash the password
    new_user = User(username=user.username)
    new_user.set_password(user.password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"msg": "User registered successfully", "username": new_user.username}

# ------------------------------------------------------------------------------------------------------------------------------------------------------

# Doctor Endpoints in FrontDesk
def generate_random_credentials():
    username = str(random.randint(100000, 999999))  # 6-digit number as username
    password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))  # 8-char password
    return username, password

def send_email(to_email, subject, body):
    sender_email = "shreshtvg@gmail.com"
    sender_password = "efco dovp xzrh xqsu"

    # msg = MIMEText(body)
    msg = body
    # msg["Subject"] = subject
    # msg["From"] = sender_email
    # msg["To"] = to_email

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg)
        server.quit()
        return "Email sent successfully"
    except Exception as e:
        return "Email failed to send"

@app.get("/doctors")
def get_doctors(specialization: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_frontdesk_user)):
    query = db.query(Doctor)
    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))
    return query.all()

@app.post("/doctors", status_code=201)
def add_doctor(
    doctor: DoctorCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_frontdesk_user)
):
    # Step 1: Generate credentials
    username, password = generate_random_credentials()

    # Step 2: Prepare email content
    email_subject = "Your Doctor Portal Login Credentials"
    email_body = f"""
    Dear {doctor.name},

    Welcome to our hospital system! 

    Here are your login details:

    Username: {username}
    Password: {password}

    Please keep them safe.

    Regards, 
    Hospital Admin
    """

    # Step 3: Try Sending Email Before Adding to DB
    try:
        send_email(to_email=doctor.email, subject=email_subject, body=email_body)
        if send_email == "Email failed to send":
            raise HTTPException(
                status_code=500,
                detail="Failed to send email. Doctor was NOT added to the database."
            )
    except Exception as e:
        print(f"❌ Email sending failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send email. Doctor was NOT added to the database."
        )

    # Step 4: Add doctor to `doctors` table ONLY if email was sent successfully
    try:
        new_doctor = Doctor(**doctor.dict())
        db.add(new_doctor)
        db.commit()
        db.refresh(new_doctor)

        # Step 5: Store in `doctor_logins` table
        password_hashed = pwd_context.hash(password)
        doctor_login = DoctorLogin(doctor_id=new_doctor.id, username=username, password=password_hashed)
        db.add(doctor_login)
        db.commit()

    except Exception as e:
        db.rollback()  # ❌ Rollback database changes if insertion fails
        print(f"❌ Database error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to add doctor to the database after email confirmation."
        )

    return {
        "msg": "Doctor added successfully",
        "doctor": new_doctor,
        "login": {"username": username, "password": password},
        "email_status": "Sent Successfully"
    }



@app.put("/doctors/{doctor_id}")
def update_doctor(doctor_id: int, doctor_data: DoctorUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_frontdesk_user)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    for key, value in doctor_data.dict(exclude_unset=True).items():
        setattr(doctor, key, value)
    db.commit()
    return {"msg": "Doctor updated successfully"}

@app.delete("/doctors/{doctor_id}")
def delete_doctor(doctor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_frontdesk_user)):
    # ✅ Find the doctor
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # ✅ Find the doctor's login record
    doctor_login = db.query(DoctorLogin).filter(DoctorLogin.doctor_id == doctor_id).first()
    
    if doctor_login:
        db.delete(doctor_login)  # ✅ Delete doctor login first

    # ✅ Delete the doctor after removing login credentials
    db.delete(doctor)
    db.commit()

    return {"msg": "Doctor and associated login deleted successfully"}



# --------------------------------------------------------------------------------------------------------------------------------------------------------
#Doctor Endpoints in Doctor webpage

@app.get("/doctor-queue")
def get_queue(
    doctor_id: int,  # Add doctor_id to the request parameters
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_doctor)
):
    # ✅ Fetch queue items where the doctor_id matches and join Appointment table
    queue_items = (
        db.query(QueueItem)
        .join(Appointment, Appointment.patient_name == QueueItem.patient_name)  # Join on patient_name (or any other appropriate field)
        .filter(Appointment.doctor_id == doctor_id)  # Filter by doctor_id in Appointment table
        .order_by(QueueItem.queue_number)  # Order by queue number (or any other field you prefer)
        .all()
    )

    if not queue_items:
        raise HTTPException(status_code=404, detail="No patients found for this doctor in the queue.")

    return queue_items

@app.delete("/doctorremovepatient/{patient_id}")
def remove_patient_from_queue_and_appointments(
    doctor_id: int,
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor)
):
    # Check if the patient exists in the appointment table for the given doctor
    appointment = db.query(Appointment).filter(Appointment.doctor_id == doctor_id).first()
    var = appointment.patient_name
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found for this doctor.")

    # Delete from appointment table
    db.delete(appointment)

    # Check if the patient exists in the queue
    queue_item = db.query(QueueItem).filter(var == QueueItem.patient_name).first()
    if queue_item:
        db.delete(queue_item)  # Remove from queue if found

    db.commit()

    return {"msg": "Patient removed successfully from both queue and appointment table"}



# ----------------------------------------------------------------------------------------------------------------------------------------------------

# Appointment Endpoints
@app.get("/appointments")
def get_appointments(db: Session = Depends(get_db), current_user: User = Depends(get_current_frontdesk_user)):
    appointments = db.query(Appointment).all()
    result = []
    for a in appointments:
        result.append({
            "id": a.id,
            "patient_name": a.patient_name,
            "doctor_id": a.doctor_id,
            "doctor_name": a.doctor.name if a.doctor else "",
            "appointment_time": a.appointment_time,
            "status": a.status
        })
    return result

@app.post("/appointments", status_code=201)
def add_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_frontdesk_user)):
    new_appointment = Appointment(
        patient_name=appointment.patient_name,
        doctor_id=appointment.doctor_id,
        appointment_time=appointment.appointment_time,
        status="booked"
    )
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    return {"msg": "Appointment booked successfully", "appointment": new_appointment}

@app.put("/appointments/{appointment_id}")
def update_appointment(appointment_id: int, appointment_data: AppointmentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_frontdesk_user)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    for key, value in appointment_data.dict(exclude_unset=True).items():
        setattr(appointment, key, value)
    db.commit()
    return {"msg": "Appointment updated successfully"}

@app.delete("/appointments/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_frontdesk_user)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(appointment)
    db.commit()
    return {"msg": "Appointment canceled successfully"}

# --------------------------------------------------------------------------------------------------------------------------------------

# Queue Endpoints
@app.get("/queue")
def get_queue(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_frontdesk_user)
):
    # ✅ Fetch queue items where the doctor_id matches
    queue_items = (
        db.query(QueueItem)
        .join(Appointment, Appointment.patient_name == QueueItem.patient_name)
        # .filter(Appointment.doctor_id == doctor_id)
        .order_by(QueueItem.queue_number)
        .all()
    )

    return queue_items


@app.post("/queue", status_code=201)
def add_to_queue(item: QueueCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_frontdesk_user)):
    last_item = db.query(QueueItem).order_by(QueueItem.queue_number.desc()).first()
    next_number = last_item.queue_number + 1 if last_item else 1
    queue_item = QueueItem(
        patient_name=item.patient_name,
        queue_number=next_number,
        status="waiting"
    )
    db.add(queue_item)
    db.commit()
    db.refresh(queue_item)
    return {"msg": "Patient added to queue", "queue_number": next_number}

@app.delete("/queue/{patient_name}", status_code=200)
def delete_from_queue(patient_name: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_frontdesk_user)):
    # Retrieve the queue item by patient name
    queue_item = db.query(QueueItem).filter(QueueItem.patient_name == patient_name).first()
    if not queue_item:
        raise HTTPException(status_code=404, detail="Queue item not found")
    
    # Delete the queue item
    db.delete(queue_item)
    db.commit()
    
    return {"msg": f"Patient '{patient_name}' removed from queue"}

@app.delete("/queue-deleteall", status_code=200)
def clear_queue(db: Session = Depends(get_db), current_user: dict = Depends(get_current_frontdesk_user)):
    """
    Delete all queue items from the database.
    """
    # Delete all QueueItem records from the table
    num_deleted = db.query(QueueItem).delete()
    db.commit()
    
    if num_deleted == 0:
        raise HTTPException(status_code=404, detail="No queue items found to delete.")
    
    return {"msg": f"Cleared {num_deleted} items from the queue."}
# @app.put("/queue/{queue_id}")
# def update_queue(queue_id: int, queue_update: QueueUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_frontdesk_user)):
#     queue_item = db.query(QueueItem).filter(QueueItem.id == queue_id).first()
#     if not queue_item:
#         raise HTTPException(status_code=404, detail="Queue item not found")
#     queue_item.status = queue_update.status
#     db.commit()
#     return {"msg": "Queue status updated successfully"}

# -------------------------------------------------------------------------------------------------------------------------------------------------

# Create a default user if not exists
def create_default_user():
    db = SessionLocal()
    if not db.query(User).filter(User.username == "admin").first():
        user = User(username="admin")
        user.set_password("admin123")
        db.add(user)
        db.commit()
    db.close()

create_default_user()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_app:app", host="0.0.0.0", port=8000, reload=True)
