import { t } from "@/utils";
import { useRef } from "react";

const SearchAutocomplete = ({
    search,
    handleSearchChange,
    handleInputFocus,
    handleInputBlur,
    autoState,
    handleSuggestionClick,
    onInputClick
}) => {

    const inputRef = useRef(null);
    
    return (
        <>
            <input
                type="text"
                placeholder={t("selectLocation")}
                onChange={handleSearchChange}
                value={search}
                ref={inputRef}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onClick={onInputClick}
                autoComplete="off"
                className="autocomplete-input"
                readOnly={!!onInputClick}
            />
            {
                autoState.show &&
                (autoState.suggestions.length > 0 || autoState.loading) && (
                    <div className="autocomplete-dropdown">
                        {autoState.loading ? (
                            <div className="autocomplete-loading">
                                {t("loading")}
                            </div>
                        ) : (
                            autoState.suggestions.map((s, idx) => (
                                <div
                                    key={idx}
                                    className="autocomplete-item"
                                    onClick={() => handleSuggestionClick(s)}
                                >
                                    {s.description || "Unknown"}
                                </div>
                            ))
                        )}
                    </div>
                )
            }
        </>
    )
}

export default SearchAutocomplete