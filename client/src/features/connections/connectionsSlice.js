import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/axios.js'

const initialState = {
  connections: [],
  pendingConnections: [],
  followers: [],
  following: []
}

// Fetch Connections
export const fetchConnections = createAsyncThunk(
  'connection/fetchConnections',
  async (token) => {
    const { data } = await api.get('/api/user/connections', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data.success ? data : null
  }
)

const connectionsSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    // future reducers can be added here
  },
  extraReducers: (builder) => {
    builder.addCase(fetchConnections.fulfilled, (state, action) => {
      if (action.payload) {
        state.connections = action.payload.connections || []
        state.pendingConnections = action.payload.pendingConnections || []
        state.followers = action.payload.followers || []
        state.following = action.payload.following || []
      }
    })
  }
})

export default connectionsSlice.reducer
