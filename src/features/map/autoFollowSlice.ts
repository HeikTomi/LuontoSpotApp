import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AutoFollowState {
  enabled: boolean;
}

const initialState: AutoFollowState = {
  enabled: false,
};

const autoFollowSlice = createSlice({
  name: 'autoFollow',
  initialState,
  reducers: {
    setAutoFollow: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.enabled = action.payload;
    },
  },
});

export const { setAutoFollow } =
  autoFollowSlice.actions;

export default autoFollowSlice.reducer;