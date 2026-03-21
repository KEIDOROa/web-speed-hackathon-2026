import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Field, InjectedFormProps, reduxForm, SubmissionError, WrappedFieldProps } from "redux-form";

import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";
import {
  parseSearchQuery,
  sanitizeSearchText,
} from "@web-speed-hackathon-2026/client/src/search/services";
import { SearchFormData } from "@web-speed-hackathon-2026/client/src/search/types";
import { validate } from "@web-speed-hackathon-2026/client/src/search/validation";
import { analyzeSentiment } from "@web-speed-hackathon-2026/client/src/utils/negaposi_analyzer";

import { Button } from "../foundation/Button";

interface Props {
  query: string;
  results: Models.Post[];
  resultsLoading: boolean;
  resultsError: Error | null;
}

const SEARCH_FIELD_LABEL =
  "検索 (例: キーワード since:2025-01-01 until:2025-12-31)";

const SearchInput = ({ input, meta }: WrappedFieldProps) => {
  const showError = Boolean(meta.error && (meta.touched || meta.submitFailed));
  return (
    <div className="flex flex-1 flex-col">
      <input
        {...input}
        aria-label={SEARCH_FIELD_LABEL}
        className={`flex-1 rounded border px-4 py-2 focus:outline-none ${
          showError ? "border-cax-danger focus:border-cax-danger" : "border-cax-border focus:border-cax-brand-strong"
        }`}
        placeholder={SEARCH_FIELD_LABEL}
        type="text"
      />
      {showError ? <span className="text-cax-danger mt-1 text-xs">{meta.error}</span> : null}
    </div>
  );
};

const SearchPageComponent = ({
  query,
  results,
  resultsLoading,
  resultsError,
  handleSubmit,
}: Props & InjectedFormProps<SearchFormData, Props>) => {
  const navigate = useNavigate();
  const [isNegative, setIsNegative] = useState(false);

  const parsed = parseSearchQuery(query);

  useEffect(() => {
    if (!parsed.keywords) {
      setIsNegative(false);
      return;
    }

    let isMounted = true;
    const run = () => {
      if (!isMounted) return;
      void analyzeSentiment(parsed.keywords)
        .then((result) => {
          if (isMounted) {
            setIsNegative(result.label === "negative");
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsNegative(false);
          }
        });
    };

    let cancelScheduled: () => void;
    if (typeof requestIdleCallback !== "undefined") {
      const idleId = requestIdleCallback(() => run(), { timeout: 4000 });
      cancelScheduled = () => cancelIdleCallback(idleId);
    } else {
      const tid = window.setTimeout(() => run(), 1);
      cancelScheduled = () => window.clearTimeout(tid);
    }

    return () => {
      isMounted = false;
      cancelScheduled();
    };
  }, [parsed.keywords]);

  const searchConditionText = useMemo(() => {
    const parts: string[] = [];
    if (parsed.keywords) {
      parts.push(`「${parsed.keywords}」`);
    }
    if (parsed.sinceDate) {
      parts.push(`${parsed.sinceDate} 以降`);
    }
    if (parsed.untilDate) {
      parts.push(`${parsed.untilDate} 以前`);
    }
    return parts.join(" ");
  }, [parsed]);

  const submitSearch = (values: SearchFormData) => {
    const errors = validate(values);
    if (Object.keys(errors).length > 0) {
      throw new SubmissionError(errors);
    }
    const sanitizedText = sanitizeSearchText(values.searchText.trim());
    navigate(`/search?q=${encodeURIComponent(sanitizedText)}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-cax-surface p-4 shadow">
        <form onSubmit={handleSubmit(submitSearch)}>
          <div className="flex gap-2">
            <Field name="searchText" component={SearchInput} />
            <Button variant="primary" type="submit">
              検索
            </Button>
          </div>
        </form>
        <p className="text-cax-text-muted mt-2 text-xs">
          since:YYYY-MM-DD で開始日、until:YYYY-MM-DD で終了日を指定できます
        </p>
      </div>

      {query && (
        <div className="px-4">
          <h2 className="text-lg font-bold">
            {searchConditionText} の検索結果 ({results.length} 件)
          </h2>
        </div>
      )}

      {isNegative && (
        <article className="hover:bg-cax-surface-subtle px-1 sm:px-4">
          <div className="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
            <div>
              <p className="text-cax-text text-lg font-bold">どしたん話聞こうか?</p>
              <p className="text-cax-text-muted">言わなくてもいいけど、言ってもいいよ。</p>
            </div>
          </div>
        </article>
      )}

      {query ? (
        resultsLoading && results.length === 0 ? (
          <div className="px-1 sm:px-4" aria-busy="true" aria-label="検索結果を読み込み中">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="border-cax-border flex animate-pulse border-b px-2 pt-2 pb-4 sm:px-4"
              >
                <div className="bg-cax-surface-subtle mr-2 size-12 shrink-0 rounded-full sm:mr-4 sm:size-16" />
                <div className="min-w-0 flex-1 space-y-3 pt-1">
                  <div className="bg-cax-surface-subtle h-3 w-40 rounded" />
                  <div className="bg-cax-surface-subtle h-3 w-full max-w-md rounded" />
                  <div className="bg-cax-surface-subtle mt-4 h-40 w-full max-w-md rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : resultsError != null && results.length === 0 ? (
          <div className="text-cax-danger flex items-center justify-center p-8">
            検索結果を読み込めませんでした
          </div>
        ) : !resultsLoading && results.length === 0 ? (
          <div className="text-cax-text-muted flex items-center justify-center p-8">
            検索結果が見つかりませんでした
          </div>
        ) : (
          <Timeline timeline={results} />
        )
      ) : null}
    </div>
  );
};

export const SearchPage = reduxForm<SearchFormData, Props>({
  form: "search",
  enableReinitialize: true,
  validate,
})(SearchPageComponent);
