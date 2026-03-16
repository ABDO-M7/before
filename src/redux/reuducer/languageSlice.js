import { createSelector, createSlice } from "@reduxjs/toolkit";

// Default to Arabic RTL so the app shows Arabic before any API/settings load
const initialState = {
    language: {
        code: 'ar',
        rtl: true,
    },
};

export const languageSlice = createSlice({
    name: "CurrentLanguage",
    initialState,
    reducers: {
        setCurrentLanguage: (state, action) => {
            state.language = action.payload;
        },
        resetCurrentLanguage: (state, action) => {
            state.language = action.payload;
        },
    },
});

export default languageSlice.reducer;
export const { setCurrentLanguage,resetCurrentLanguage } = languageSlice.actions;

export const CurrentLanguageData = createSelector(
    (state) => state.CurrentLanguage,
    (CurrentLanguage) => CurrentLanguage.language
);
