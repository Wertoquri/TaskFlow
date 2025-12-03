import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useI18n } from '../context/I18nContext.jsx';

const socket = io('http://localhost:5000');

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const { t } = useI18n();

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
      <h3>{t('tasksTitle')}</h3>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title} - {task.status}</li>
        ))}
      </ul>
    </div>
  );
};

export default Tasks;
