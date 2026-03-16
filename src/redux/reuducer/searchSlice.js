import { createSelector, createSlice } from "@reduxjs/toolkit";

const initialState = {
    searchQuery: '',
    serachTag: "",
    /** Quick Search: filters to apply on listing page without URL (same as filter box). Cleared after apply. */
    pendingQuickSearchFilters: null,
}

export const searchSlice = createSlice({
    name: "Search",
    initialState,
    reducers: {
        setSearch: (state, action) => {
            state.searchQuery = action.payload
        },
        setSearchTag:(state, action) => {
            state.serachTag = action.payload
        },
        setPendingQuickSearchFilters: (state, action) => {
            state.pendingQuickSearchFilters = action.payload
        },
        clearPendingQuickSearchFilters: (state) => {
            state.pendingQuickSearchFilters = null
        },
    }
})

export default searchSlice.reducer;
export const { setSearch, setSearchTag, setPendingQuickSearchFilters, clearPendingQuickSearchFilters } = searchSlice.actions

export const SearchData = createSelector(
    (state) => state.Search,
    (Search) => Search.searchQuery
)
export const searchedTag = createSelector(
    (state) => state.Search,
    (Search) => Search.serachTag
)
export const pendingQuickSearchFiltersData = createSelector(
    (state) => state.Search,
    (Search) => Search.pendingQuickSearchFilters
)