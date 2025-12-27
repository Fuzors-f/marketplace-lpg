import app from './app.js';

// Passenger will automatically bind to the correct port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
