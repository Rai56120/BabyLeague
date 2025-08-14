import { useEffect, useState } from 'react';
import axios from 'axios';


// Frontend
const FRONTEND_URL = 'http://localhost:';
const BACKEND_PORT = 5000;
const API_PLAYERS = '/api/players'; // Adjust if deployed
const API_PLAYERS_URL = FRONTEND_URL + BACKEND_PORT + API_PLAYERS;

function App() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // Fetch all players
  const fetchPlayers = async () => {
    try {
      const res = await axios.get(API_PLAYERS_URL);
      setPlayers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load players');
    }
  };


  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post(API_PLAYERS_URL, { name });
      setName('');
      fetchPlayers(); // Refresh list after adding
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to add player');
      }
    }
  };

  // Load players on page load
  useEffect(() => {
    fetchPlayers();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Players</h1>

      {/* Error message */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Add player form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ marginRight: '0.5rem' }}
        />
        <button type="submit">Create Player</button>

        <button type="submit">Delete Player</button>
      </form>

      {/* Player list */}
      <ul>
        {players.map((u) => (
          <li key={u.id}>
            {u.name}....
            {u.matches}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
