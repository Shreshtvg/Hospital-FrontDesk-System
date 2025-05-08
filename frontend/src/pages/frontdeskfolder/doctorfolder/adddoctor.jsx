import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
// import '../../globals.css';

export default function AddOrEditDoctor() {
  const router = useRouter();
  const { id } = router.query;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const [doctorData, setDoctorData] = useState({
    name: '',
    specialization: '',
    gender: '',
    email: ''
  });

  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode) {
      fetchDoctorDetails(id);
    }
  }, [id]);

  const fetchDoctorDetails = async (doctorId) => {
    try {
      const res = await fetch(`http://localhost:8000/doctors/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        router.push('/frontdeskfolder/loginfolder/login');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setDoctorData(data);
      } else {
        alert('Failed to load doctor details.');
      }
    } catch (err) {
      console.error('Error fetching doctor details:', err);
    }
  };

  const handleChange = (e) => {
    setDoctorData({ ...doctorData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditMode
      ? `http://localhost:8000/doctors/${id}`
      : `http://localhost:8000/doctors`;

    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(doctorData),
      });

      if (res.status === 401) {
        router.push('/frontdeskfolder/loginfolder/login');
        return;
      }

      const response = await res.json();
      if (res.ok) {
        alert(isEditMode ? 'Doctor updated successfully.' : 'Doctor added successfully.');
        router.push('/frontdeskfolder/doctorfolder/doctormanagement');
      } else {
        alert(response?.msg || 'Operation failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="container mx-auto max-w-xl p-6 bg-white rounded shadow mt-6">
      <h2 className="text-2xl font-semibold mb-4 text-center text-black">
        {isEditMode ? 'Edit Doctor' : 'Add Doctor'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {['name', 'specialization', 'gender', 'email'].map((field) => (
          <div key={field}>
            <label className="block mb-1 text-sm font-medium capitalize text-black">
              {field}
            </label>
            <input
              type="text"
              name={field}
              value={doctorData[field]}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder={`Enter ${field}`}
            />
          </div>
        ))}
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded mt-4"
        >
          {isEditMode ? 'Update Doctor' : 'Add Doctor'}
        </button>
      </form>
    </div>
  );
}
