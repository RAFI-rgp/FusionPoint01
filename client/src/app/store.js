// Fronted

import * as toolkit from '@reduxjs/toolkit';
import userReducer from '../features/user/userSlice.js';
import connectionsReducer from '../features/connections/connectionsSlice.js';
import messagesReducer from '../features/messages/messagesSlice.js';

export const store = toolkit.configureStore({
    reducer: {
        user: userReducer,
        connections: connectionsReducer,
        messages: messagesReducer
    }
})