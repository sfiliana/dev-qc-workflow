"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Use the client you created in step 4 earlier

export default function WorkflowBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch data from Supabase
  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      setTasks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) return <p className="p-10 text-center">Loading Workflow...</p>;

  // Function to filter tasks by status (for your columns)
  const getTasksByStatus = (status) => tasks.filter(task => task.status === status);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dev-QC Workflow</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Render Columns Dynamically */}
        {['Todo', 'In Progress', 'QC', 'Done'].map((column) => (
          <div key={column} className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <h2 className="font-semibold mb-4 border-b pb-2">{column}</h2>
            
            {getTasksByStatus(column).length === 0 && (
              <p className="text-gray-400 text-sm italic">No tasks</p>
            )}

            {getTasksByStatus(column).map((task) => (
              <div key={task.id} className="bg-white p-3 mb-3 rounded shadow-sm border-l-4 border-blue-500">
                <h3 className="font-bold text-sm">{task.title}</h3>
                <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    task.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-gray-200'
                  }`}>
                    {task.priority}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">{task.developer}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
