import { SearchInput } from "@aivenio/aquarium";
import debounce from "lodash/debounce";
import type { ChangeEvent } from "react";
import { useFiltersContext } from "src/app/features/components/filters/useFiltersContext";

type SearchFilterProps = {
  placeholder: string;
  description: string;
};

function SearchFilter({ placeholder, description }: SearchFilterProps) {
  const { search, setFilterValue } = useFiltersContext();
  return (
    <>
      <SearchInput
        type={"search"}
        aria-label={placeholder}
        aria-describedby={"search-field-description"}
        role="search"
        placeholder={placeholder}
        defaultValue={search.toString()}
        onChange={debounce(
          (event: ChangeEvent<HTMLInputElement>) =>
            setFilterValue({
              name: "search",
              value: String(event.target.value).trim(),
            }),
          500
        )}
      />
      <div id={"search-field-description"} className={"visually-hidden"}>
        {description}
      </div>
    </>
  );
}

export { SearchFilter };
