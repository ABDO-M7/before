import { createSelector, createSlice } from "@reduxjs/toolkit";
import { store } from "../store";

const initialState = {
    chatState: {
        chatAudio: {}
    },
    notifications: {},
    IsShowBankDetails: false,
    IsLoginModalOpen: false,
    IsRegisterModalOpen: false,
    IsVisitedLandingPage: false,
    IsDrawerOpen: false
};

export const globalStateSlice = createSlice({
    name: "GlobalState",
    initialState,
    reducers: {
        setChatAudio: (state, action) => {
            state.chatState.chatAudio = action.payload?.data;
        },
        setNotifications: (state, action) => {
            state.notifications = action.payload;
        },
        setIsShowBankDetails: (state, action) => {
            state.IsShowBankDetails = action.payload;
        },
        setIsLoginModalOpen: (state, action) => {
            state.IsLoginModalOpen = action.payload;
        },
        setIsRegisterModalOpen: (state, action) => {
            state.IsRegisterModalOpen = action.payload;
        },
        setIsVisitedLandingPage: (location, action) => {
            location.IsVisitedLandingPage = action.payload;
        },
        setIsDrawerOpen: (state, action) => {
            state.IsDrawerOpen = action.payload;
        },
    },
});

export default globalStateSlice.reducer;
export const { setChatAudio, setNotifications, setIsShowBankDetails, setIsLoginModalOpen, setIsRegisterModalOpen, setIsVisitedLandingPage, setIsDrawerOpen } = globalStateSlice.actions;

export const loadChatAudio = (data) => {
    store.dispatch(setChatAudio({ data }));
}

export const showBankDetails = () => {
    store.dispatch(setIsShowBankDetails(true));
};

// Function to set IsShowBankDetails to false
export const hideBankDetails = () => {
    store.dispatch(setIsShowBankDetails(false));
};


// Function to set login modal state with any boolean value
export const toggleLoginModal = (isOpen) => {
    store.dispatch(setIsLoginModalOpen(isOpen));
};

// Function to set register modal state with any boolean value
export const toggleRegisterModal = (isOpen) => {
    store.dispatch(setIsRegisterModalOpen(isOpen));
};

// Function to set drawer state with any boolean value
export const toggleDrawer = (isOpen) => {
    store.dispatch(setIsDrawerOpen(isOpen));
};

// create selector
export const getGlobalStateData = createSelector(
    (state) => state.GlobalState,
    (GlobalState) => GlobalState
);
export const getIsLoginModalOpen = createSelector(
    (state) => state.GlobalState,
    (GlobalState) => GlobalState.IsLoginModalOpen
);

export const getIsRegisterModalOpen = createSelector(
    (state) => state.GlobalState,
    (GlobalState) => GlobalState.IsRegisterModalOpen
);

export const getGlobalNotifications = createSelector(
    (state) => state.GlobalState,
    (GlobalState) => GlobalState.notifications
);

export const getIsShowBankDetails = createSelector(
    (state) => state.GlobalState,
    (GlobalState) => GlobalState.IsShowBankDetails
);

export const getIsVisitedLandingPage = createSelector(
    (state) => state.GlobalState,
    (GlobalState) => GlobalState.IsVisitedLandingPage
);

export const getIsDrawerOpen = createSelector(
    (state) => state.GlobalState,
    (GlobalState) => GlobalState.IsDrawerOpen
);
