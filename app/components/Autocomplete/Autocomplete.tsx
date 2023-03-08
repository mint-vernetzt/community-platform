import { useSubmit } from "@remix-run/react";
import React, { useEffect, useState } from "react";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { H3 } from "../Heading/Heading";

export interface AutocompleteProps {
  suggestions: any[];
  suggestionsLoaderPath: string;
  value: String;
}

const Autocomplete = React.forwardRef(
  (
    props: React.HTMLProps<HTMLInputElement> & AutocompleteProps,
    forwardRef
  ) => {
    const { suggestions, suggestionsLoaderPath, value, ...rest } = props;

    const [searchedValue, setSearchedValue] = useState(value);
    const [activeSuggestion, setActiveSuggestion] = useState(0);
    const submit = useSubmit();

    useEffect(() => {
      setSearchedValue(value);
    }, [value]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
      submit(
        {
          suggestions_query: event.target.value,
        },
        {
          method: "get",
          action: suggestionsLoaderPath,
        }
      );
      setSearchedValue(event.target.value);
    };

    const handleKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>
    ): void => {
      // TODO: Scroll when selection is out of screen
      if (event.key === "ArrowDown" && activeSuggestion < suggestions.length) {
        event.preventDefault();
        event.stopPropagation();
        setActiveSuggestion(activeSuggestion + 1);
      } else if (event.key === "ArrowUp" && activeSuggestion > 1) {
        event.preventDefault();
        event.stopPropagation();
        setActiveSuggestion(activeSuggestion - 1);
      } else if (event.key === "Enter") {
        setSearchedValue(suggestions[activeSuggestion - 1].name);
        setActiveSuggestion(0);
      }
    };

    const handleMouseOver = (index: number): void => {
      setActiveSuggestion(index + 1);
    };

    const handleClick = () => {
      setSearchedValue(suggestions[activeSuggestion - 1].name);
      setActiveSuggestion(0);
    };

    return (
      <>
        <input
          {...rest}
          ref={forwardRef as React.RefObject<HTMLInputElement>}
          className="input input-bordered w-full mb-2"
          value={searchedValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {suggestions.length >= 0
          ? suggestions.map((suggestion, index) => {
              // TODO: Outsource this as child element to props
              // ChildElements should have boolean property active
              // This property should be passed inside here as follows: active={index === activeSuggestion - 1}
              const initials = getInitialsOfName(suggestion.name);
              return (
                <button
                  key={suggestion.id}
                  className={`${
                    index === activeSuggestion - 1 ? "bg-blue-100 " : ""
                  }w-full flex items-center flex-row border-b border-neutral-400 p-4 cursor-pointer rounded-lg`}
                  onClick={() => handleClick()}
                  onMouseOver={() => handleMouseOver(index)}
                >
                  <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden">
                    {suggestion.logo !== null && suggestion.logo !== "" ? (
                      <img src={suggestion.logo} alt={suggestion.name} />
                    ) : (
                      <>{initials}</>
                    )}
                  </div>
                  <div className="pl-4">
                    <H3 like="h4" className="text-xl mb-1">
                      {suggestion.name}
                    </H3>
                    {suggestion.types.length !== 0 ? (
                      <p className="font-bold text-sm">
                        {suggestion.types
                          .map((item) => {
                            return item.organizationType.title;
                          })
                          .join(" / ")}
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })
          : null}
      </>
    );
  }
);

export default Autocomplete;
Autocomplete.displayName = "Autocomplete";
