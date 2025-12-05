import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../features/user/userSlice.js';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

const ProfileModal = ({ setShowEdit }) => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();

  const user = useSelector((state) => state.user.value);

  const [editForm, setEditForm] = useState({
    username: user.username,
    bio: user.bio,
    location: user.location,
    profile_picture: null,
    cover_photo: null,
    full_name: user.full_name,
  });

  const handleSaveProfile = async () => {
    const userData = new FormData();
    const { full_name, username, bio, location, profile_picture, cover_photo } = editForm;

    userData.append('username', username);
    userData.append('bio', bio);
    userData.append('location', location);
    userData.append('full_name', full_name);

    if (profile_picture) userData.append('profile', profile_picture);
    if (cover_photo) userData.append('cover', cover_photo);

    const token = await getToken();

    await dispatch(updateUser({ userData, token }));

    setShowEdit(false);
  };

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 z-110 h-screen overflow-y-scroll bg-black/50">
      <div className="max-w-2xl sm:py-6 mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.promise(handleSaveProfile(), {
                loading: 'Saving...',
                success: 'Profile Updated!',
                error: 'Something went wrong!',
              });
            }}
          >
            {/* Profile Photo */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Profile Picture</label>

              <div className="relative group w-24 h-24">
                <img
                  src={
                    editForm.profile_picture
                      ? URL.createObjectURL(editForm.profile_picture)
                      : user.profile_picture
                  }
                  alt=""
                  className="w-24 h-24 rounded-full object-cover"
                />

                <label
                  htmlFor="profile_picture"
                  className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center rounded-full cursor-pointer"
                >
                  <Pencil className="text-white w-5 h-5" />
                </label>

                <input
                  type="file"
                  id="profile_picture"
                  hidden
                  accept="image/*"
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      profile_picture: e.target.files[0],
                    })
                  }
                />
              </div>
            </div>

            {/* Cover Photo */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Cover Photo</label>

              <div className="relative group">
                <img
                  src={
                    editForm.cover_photo
                      ? URL.createObjectURL(editForm.cover_photo)
                      : user.cover_photo
                  }
                  alt=""
                  className="w-80 h-40 rounded-lg object-cover bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200"
                />

                <label
                  htmlFor="cover_photo"
                  className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/30 rounded-lg cursor-pointer"
                >
                  <Pencil className="text-white w-5 h-5" />
                </label>

                <input
                  type="file"
                  id="cover_photo"
                  hidden
                  accept="image/*"
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      cover_photo: e.target.files[0],
                    })
                  }
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg"
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm({ ...editForm, full_name: e.target.value })
                }
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg"
                value={editForm.username}
                onChange={(e) =>
                  setEditForm({ ...editForm, username: e.target.value })
                }
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                rows={3}
                className="w-full p-3 border rounded-lg"
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
