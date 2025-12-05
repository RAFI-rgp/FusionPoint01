import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';

const initialState = {
    value: null
};

// -------------------- Async Thunks --------------------
export const fetchUser = createAsyncThunk(
    'user/fetchUser',
    async (token) => {
        try {
            const { data } = await api.get('/api/user/data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return data.success ? data.user : null;
        } catch (error) {
            toast.error(error.message);
            return null;
        }
    }
);

export const updateUser = createAsyncThunk(
    'user/update',
    async ({ userData, token }) => {
        try {
            const { data } = await api.put('/api/user/update', userData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(data.message);
                return data.user;
            } else {
                toast.error(data.message);
                return null;
            }
        } catch (error) {
            toast.error(error.message);
            return null;
        }
    }
);

// -------------------- Slice --------------------
const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        // ✅ Clerk user directly set
        setUser: (state, action) => {
            state.value = action.payload;
        },
        clearUser: (state) => {
            state.value = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.value = action.payload;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.value = action.payload;
            });
    }
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
