// DELETE /api/leagues/[id] - Vercel API Route
export default function handler(req, res) {
  const { id } = req.query;
  
  if (req.method === 'DELETE') {
    // Simulated delete for now
    console.log(`Deleting league with ID: ${id}`);
    res.status(200).json({ message: `League ${id} deleted successfully` });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
