import React, { useState, useEffect, useCallback } from "react";
import { faSun, faMoon, faAdjust } from "@fortawesome/free-solid-svg-icons";

export const useTheme = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "auto");

    const applyTheme = useCallback((selectedTheme) => {
        const prefersDarkMode = !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
        const themeToApply = selectedTheme === "auto" ? (prefersDarkMode ? "dark" : "light") : selectedTheme;
        document.documentElement.setAttribute("data-theme", themeToApply);
    }, []);

    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem("theme", theme);

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => theme === "auto" && applyTheme("auto");
        mediaQuery.addListener(handleChange);

        return () => mediaQuery.removeListener(handleChange);
    }, [theme, applyTheme]);

    const handleThemeChange = () => {
        setTheme((prevTheme) => {
            switch (prevTheme) {
                case "light": return "dark";
                case "dark": return "auto";
                case "auto": return "light";
                default: return "light";
            }
        });
    };

    const getThemeIcon = () => {
        switch (theme) {
            case "light": return faSun;
            case "dark": return faMoon;
            case "auto": return faAdjust;
            default: return faSun;
        }
    };

    return { theme, handleThemeChange, getThemeIcon };
};

export const useMemoStorage = () => {
    const [memos, setMemos] = useState([]);
    const [currentMemo, setCurrentMemo] = useState({ id: null, title: "", content: "", tags: [] });

    useEffect(() => {
        const fetchGuideContent = async () => {
            try {
                const response = await fetch("/guide.md");
                if (response.ok) {
                    const guideContent = await response.text();
                    const initialMemo = {
                        id: Date.now(),
                        title: "使用指南",
                        content: guideContent,
                        tags: ["教程"]
                    };
                    setMemos([initialMemo]);
                    setCurrentMemo(initialMemo);
                } else {
                    console.error("Failed to fetch guide.md");
                }
            } catch (error) {
                console.error("Error fetching guide content:", error);
            }
        };

        const savedMemos = JSON.parse(localStorage.getItem("memos") || "[]");
        const savedCurrentMemoId = localStorage.getItem("currentMemoId");

        if (savedMemos.length > 0) {
            setMemos(savedMemos);
            const lastMemo = savedMemos.find((memo) => memo.id === parseInt(savedCurrentMemoId)) || savedMemos[0];
            setCurrentMemo(lastMemo);
        } else {
            fetchGuideContent();
        }
    }, []);

    const saveMemo = useCallback((memoToSave) => {
        setMemos((prevMemos) => {
            const updatedMemos = prevMemos.map((memo) => memo.id === memoToSave.id ? memoToSave : memo);
            localStorage.setItem("memos", JSON.stringify(updatedMemos));
            localStorage.setItem("currentMemoId", memoToSave.id.toString());
            return updatedMemos;
        });
    }, []);

    const createNewMemo = useCallback(() => {
        const newMemo = { id: Date.now(), title: `新建备忘录 ${memos.length + 1}`, content: "", tags: [] };
        setMemos((prevMemos) => {
            const updatedMemos = [...prevMemos, newMemo];
            localStorage.setItem("memos", JSON.stringify(updatedMemos));
            localStorage.setItem("currentMemoId", newMemo.id.toString());
            return updatedMemos;
        });
        setCurrentMemo(newMemo);
        return newMemo;
    }, [memos.length]);

    return { memos, setMemos, currentMemo, setCurrentMemo, saveMemo, createNewMemo };
};
