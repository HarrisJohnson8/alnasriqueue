 "use client";
import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';

type ServiceType = "gelin" | "buuxin" | "xirid" | "dhaqid" | "bedel";
type StageType = "cusub" | "so labtay";

interface Patient {
  id: number;
  name: string;
  status: "pending" | "done";
  stage: StageType;
  service: ServiceType;
  ticket_number: number;
  created_at: string;
}

export default function Home() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [name, setName] = useState("");
  const [stage, setStage] = useState<StageType>("cusub");
  const [service, setService] = useState<ServiceType>("gelin");
  const [loading, setLoading] = useState(true);

  // Fetch patients from Supabase
  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('ticket_number', { ascending: true });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Get next ticket number
  const getNextTicketNumber = async (): Promise<number> => {
    const { data, error } = await supabase
      .from('patients')
      .select('ticket_number')
      .order('ticket_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error getting ticket number:', error);
      return 1;
    }

    return data && data.length > 0 ? data[0].ticket_number + 1 : 1;
  };

  // Add new patient
  const addPatient = async () => {
    if (!name.trim()) return;

    try {
      const nextTicketNumber = await getNextTicketNumber();
      
      const newPatient = {
        name: name.trim(),
        status: "pending",
        stage,
        service,
        ticket_number: nextTicketNumber,
      };

      const { data, error } = await supabase
        .from('patients')
        .insert([newPatient])
        .select()
        .single();

      if (error) throw error;

      setPatients([...patients, data]);
      setName("");
      setStage("cusub");
      setService("gelin");
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };

  // Toggle status
  const toggleStatus = async (id: number, currentStatus: "pending" | "done") => {
    try {
      const newStatus = currentStatus === "pending" ? "done" : "pending";
      
      const { error } = await supabase
        .from('patients')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setPatients(
        patients.map((p) =>
          p.id === id ? { ...p, status: newStatus } : p
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Delete patient
  const deletePatient = async (id: number) => {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPatients(patients.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-10 text-white flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-10 text-white">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-yellow-400 tracking-wide drop-shadow-md">
        Alnasri Patient List
      </h1>

      {/* Add Form */}
      <div className="flex gap-3 mb-6 flex-wrap bg-gray-800/70 p-6 rounded-2xl shadow-lg">
        <input
          type="text"
          placeholder="Patient Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 px-4 py-2 rounded-xl focus:outline-none focus:border-yellow-400 text-white placeholder-gray-400"
        />

        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as StageType)}
          className="bg-gray-900 border border-gray-700 px-4 py-2 rounded-xl focus:outline-none focus:border-yellow-400 text-white"
        >
          <option value="cusub">Cusub</option>
          <option value="so labtay">So labtay</option>
        </select>

        <select
          value={service}
          onChange={(e) => setService(e.target.value as ServiceType)}
          className="bg-gray-900 border border-gray-700 px-4 py-2 rounded-xl focus:outline-none focus:border-yellow-400 text-white"
        >
          <option value="gelin">Gelin</option>
          <option value="buuxin">Buuxin</option>
          <option value="xirid">Xirid</option>
          <option value="dhaqid">Dhaqid</option>
          <option value="bedel">Bedel</option>
        </select>

        <button
          onClick={addPatient}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-6 py-2 rounded-xl shadow-md transition"
        >
          Add
        </button>
      </div>

      {/* Queue Table */}
      <div className="overflow-x-auto rounded-2xl shadow-xl border border-gray-700">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800 text-yellow-400">
              <th className="px-4 py-3">Ticket #</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr
                key={p.id}
                className={`${
                  p.status === "done"
                    ? "bg-green-900/50 text-green-300"
                    : "bg-gray-900/60"
                } hover:bg-gray-700/50 transition`}
              >
                <td className="px-4 py-3 font-mono">{p.ticket_number}</td>
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 capitalize">{p.stage}</td>
                <td className="px-4 py-3 capitalize">{p.service}</td>
                <td className="px-4 py-3 capitalize">{p.status}</td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => toggleStatus(p.id, p.status)}
                    className="bg-green-500 hover:bg-green-400 text-black font-semibold px-3 py-1 rounded-lg shadow"
                  >
                    Toggle
                  </button>
                  <button
                    onClick={() => deletePatient(p.id)}
                    className="bg-red-500 hover:bg-red-400 text-black font-semibold px-3 py-1 rounded-lg shadow"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  No patients in queue
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}