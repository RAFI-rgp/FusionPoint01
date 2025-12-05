import React, { useRef, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useDispatch } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';

import Layout from './pages/Layout.jsx';
import Login from './pages/Login.jsx';
import Feed from './pages/Feed.jsx';
import Messages from './pages/Messages.jsx';
import ChatBox from './pages/ChatBox.jsx';
import Connections from './pages/Connections.jsx';
import Discover from './pages/Discover.jsx';
import Profile from './pages/Profile.jsx';
import CreatePost from './pages/CreatePost.jsx';
import Notification from './components/Notifications.jsx';

import { setUser, clearUser } from './features/user/userSlice.js';
import { fetchUser } from './features/user/userSlice.js';
import { fetchConnections } from './features/connections/connectionsSlice.js';
import { addMessage } from './features/messages/messagesSlice.js';

const App = () => {
  const { user: clerkUser, isLoaded } = useUser();
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);

  // -----------------------------
  // Sync Clerk user to Redux
  // -----------------------------
  useEffect(() => {
    if (isLoaded) {
      if (clerkUser) {
        dispatch(setUser({
          id: clerkUser.id,
          fullName: clerkUser.fullName,
          email: clerkUser.primaryEmailAddress.emailAddress,
          image: clerkUser.imageUrl
        }));

        // Fetch backend data
        (async () => {
          const token = await getToken();
          dispatch(fetchUser(token));
          dispatch(fetchConnections(token));
        })();

      } else {
        dispatch(clearUser());
      }
    }
  }, [isLoaded, clerkUser, getToken, dispatch]);

  // -----------------------------
  // Keep track of current pathname
  // -----------------------------
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // -----------------------------
  // EventSource for live messages
  // -----------------------------
  useEffect(() => {
    if (!clerkUser) return;

    const eventSource = new EventSource(
      import.meta.env.VITE_BASEURL + '/api/message/' + clerkUser.id
    );

    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (pathnameRef.current === '/messages/' + message.from_user_id._id) {
        dispatch(addMessage(message));
      } else {
        toast.custom((t) => <Notification t={t} message={message} />, {
          position: 'bottom-right'
        });
      }
    };

    return () => {
      eventSource.close();
    };
  }, [clerkUser, dispatch]);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={!clerkUser ? <Login /> : <Layout />}>
          <Route index element={<Feed />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:userId" element={<ChatBox />} />
          <Route path="connections" element={<Connections />} />
          <Route path="discover" element={<Discover />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:profileId" element={<Profile />} />
          <Route path="create-post" element={<CreatePost />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
