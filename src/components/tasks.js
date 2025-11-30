// frontend/src/components/Tasks.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const Tasks = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    socket.on('task-updated', (updatedTask) => {
      setTasks((prevTasks) => {
        return prevTasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        );
      });
    });

    // Clean up the socket connection
    return () => socket.off('task-updated');
  }, []);

  return (
    <div>
      <h3>Tasks</h3>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title} - {task.status}</li>
        ))}
      </ul>
    </div>
  );
};

export default Tasks;
