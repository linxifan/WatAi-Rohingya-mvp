"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  formatMessage,
  getMessages,
  loadInterfaceLocale,
  saveInterfaceLocale,
  type LocaleId,
  type Messages,
} from "@/lib/i18n";

type LocaleContextValue = {
  locale: LocaleId;
  setLocale: (locale: LocaleId) => void;
  messages: Messages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function subscribeInterfaceLocale(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("ruaingga-interface-locale", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("ruaingga-interface-locale", onChange);
  };
}

function readStoredLocale(): LocaleId {
  return loadInterfaceLocale();
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const storedLocale = useSyncExternalStore(
    subscribeInterfaceLocale,
    readStoredLocale,
    () => DEFAULT_LOCALE,
  );
  const [sessionLocale, setSessionLocale] = useState<LocaleId | null>(null);
  const locale = sessionLocale ?? storedLocale;

  const setLocale = useCallback((next: LocaleId) => {
    setSessionLocale(next);
    saveInterfaceLocale(next);
  }, []);

  const messages = useMemo(() => getMessages(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale === "rhg" ? "rhg" : "en";
    document.title = formatMessage(messages.app.documentTitle, {
      title: messages.app.title,
      english: messages.languages.english,
      rohingya: messages.languages.rohingya,
    });
  }, [locale, messages]);

  const value = useMemo(
    () => ({ locale, setLocale, messages }),
    [locale, setLocale, messages],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return value;
}
