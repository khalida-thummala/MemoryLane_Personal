import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Layout
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Timeline from './pages/Timeline';
import Albums from './pages/Albums';
import MemoryDetail from './pages/MemoryDetail';
import Reminisce from './pages/Reminisce';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import AlbumDetail from './pages/AlbumDetail';
import PublicMemory from './pages/PublicMemory';
import JoinAlbum from './pages/JoinAlbum';
import CommunityTimeline from './pages/CommunityTimeline';
import SharedAlbums from './pages/SharedAlbums';
import Social from './pages/Social';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/public/:id" element={<PublicMemory />} />

          <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
          <Route path="/albums" element={<ProtectedRoute><Albums /></ProtectedRoute>} />
          <Route path="/shared-albums" element={<ProtectedRoute><SharedAlbums /></ProtectedRoute>} />
          <Route path="/album/:id" element={<ProtectedRoute><AlbumDetail /></ProtectedRoute>} />
          <Route path="/album/join/:token" element={<JoinAlbum />} />
          <Route path="/community" element={<CommunityTimeline />} />
          <Route path="/memory/:id" element={<ProtectedRoute><MemoryDetail /></ProtectedRoute>} />
          <Route path="/reminisce" element={<ProtectedRoute><Reminisce /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
