// client/src/pages/Messages.jsx
import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const Messages = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecent = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await api.get("/api/user/recent-messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setRecent(data.messages);
      else toast.error(data.message || "Failed to load");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchRecent();
    // eslint-disable-next-line
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Messages</h2>

      {loading && <p>Loading...</p>}

      {!loading && recent.length === 0 && (
        <p className="text-gray-500">No recent conversations</p>
      )}

      <div className="space-y-3">
        {recent.map((m) => (
          <Link
            key={m.partner._id}
            to={`/messages/${m.partner._id}`}
            className="flex items-center gap-3 p-3 bg-white rounded shadow hover:shadow-md transition"
          >
            <img
              src={m.partner.profile_picture || "/default-avatar.png"}
              alt=""
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">{m.partner.full_name}</h4>
                <span className="text-xs text-gray-400">
                  {new Date(m.lastMessage.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {m.lastMessage.text || (m.lastMessage.message_type === "image" ? "Image" : "")}
              </p>
            </div>
            {m.unseenCount > 0 && (
              <div className="ml-2 text-sm bg-indigo-600 text-white px-2 py-1 rounded-full">
                {m.unseenCount}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Messages;
