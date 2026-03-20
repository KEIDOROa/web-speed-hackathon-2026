import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";

export function useSearchParams(): [URLSearchParams] {
  const location = useLocation();
  const [searchParams, setSearchParams] = useState(
    () => new URLSearchParams(location.search),
  );

  useEffect(() => {
    setSearchParams(new URLSearchParams(location.search));
  }, [location.search]);

  return [searchParams];
}
