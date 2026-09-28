import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/common/PageHeader.jsx";
import {
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";
import AiEditorForm from "../components/ai/AiEditorForm.jsx";
import AiResultPreview from "../components/ai/AiResultPreview.jsx";

import { aiService } from "../services/aiService.js";
import { categoryService } from "../services/categoryService.js";
import { newsService } from "../services/newsService.js";

import useAuth from "../hooks/useAuth.js";

function createNewsId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `news-${crypto.randomUUID()}`;
  }

  return `news-${Date.now()}`;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es");
}

function AiEditorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const requestControllerRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [sourceData, setSourceData] = useState(null);
  const [result, setResult] = useState(null);

  const [loadingCategories, setLoadingCategories] =
    useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [generateError, setGenerateError] =
    useState("");
  const [saveError, setSaveError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      setLoadingCategories(true);
      setLoadError("");

      try {
        const data = await categoryService.getAll(
          controller.signal
        );

        if (!controller.signal.aborted) {
          setCategories(
            Array.isArray(data) ? data : []
          );
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
    };
  }, []);

  function findSuggestedCategory(aiResult) {
    if (
      categories.some(
        (categoryItem) =>
          categoryItem.id === aiResult.categoryId
      )
    ) {
      return aiResult.categoryId;
    }

    const suggestedName =
      aiResult.categoryName ||
      aiResult.suggestedCategory ||
      aiResult.category;

    const matchingCategory = categories.find(
      (categoryItem) =>
        normalizeText(categoryItem.name) ===
        normalizeText(suggestedName)
    );

    return matchingCategory?.id || "";
  }

  async function handleGenerate(values) {
    requestControllerRef.current?.abort();

    const controller = new AbortController();
    requestControllerRef.current = controller;

    setGenerating(true);
    setGenerateError("");
    setSaveError("");
    setResult(null);
    setSourceData(values);

    try {
      const aiResult =
        await aiService.generateEditorialContent(
          {
            ...values,
            categories: categories.map(
              (categoryItem) => ({
                id: categoryItem.id,
                name: categoryItem.name,
              })
            ),
          },
          controller.signal
        );

      const lowerThirdOptions = Array.isArray(
        aiResult.lowerThirdOptions
      )
        ? aiResult.lowerThirdOptions
            .map((option) => String(option).trim())
            .filter(Boolean)
        : [];

      const selectedLowerThird =
        lowerThirdOptions.includes(
          aiResult.selectedLowerThird
        )
          ? aiResult.selectedLowerThird
          : lowerThirdOptions[0] || "";

      setResult({
        title: String(aiResult.title || "").trim(),
        summary: String(
          aiResult.summary || ""
        ).trim(),
        script: String(aiResult.script || "").trim(),
        lowerThirdOptions,
        selectedLowerThird,
        categoryId:
          findSuggestedCategory(aiResult),
        editorialStatus: "draft",
        estimatedDurationSeconds:
          Number(
            aiResult.estimatedDurationSeconds
          ) ||
          values.targetDurationSeconds,
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        setGenerateError(error.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setGenerating(false);
      }
    }
  }

  function validateResult() {
    if (!result.title?.trim()) {
      return "La propuesta debe tener un título.";
    }

    if (result.summary?.trim().length < 20) {
      return "El resumen debe tener al menos 20 caracteres.";
    }

    if (!result.categoryId) {
      return "Selecciona una categoría antes de guardar.";
    }

    if (
      result.editorialStatus === "approved" &&
      result.script?.trim().length < 20
    ) {
      return "Una noticia aprobada debe tener un guion de al menos 20 caracteres.";
    }

    return "";
  }

  async function handleSave() {
    const validationMessage = validateResult();

    if (validationMessage) {
      setSaveError(validationMessage);
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const currentDate = new Date().toISOString();

      const newsItem = {
        id: createNewsId(),
        sourceText: sourceData.sourceText,
        sourceName: sourceData.sourceName,
        sourceUrl: sourceData.sourceUrl,
        title: result.title.trim(),
        summary: result.summary.trim(),
        script: result.script.trim(),
        lowerThirdOptions:
          result.lowerThirdOptions || [],
        selectedLowerThird:
          result.selectedLowerThird || "",
        categoryId: result.categoryId,
        editorialStatus:
          result.editorialStatus || "draft",
        estimatedDurationSeconds:
          Number(
            result.estimatedDurationSeconds
          ) || 0,
        createdBy: user.id,
        updatedBy: user.id,
        createdAt: currentDate,
        updatedAt: currentDate,
        aiAssisted: true,
        isDemo: false,
      };

      const savedNews =
        await newsService.create(newsItem);

      navigate(`/news/${savedNews.id}`, {
        replace: true,
      });
    } catch (error) {
      setSaveError(
        error.message ||
          "No fue posible guardar la noticia."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleClearResult() {
    requestControllerRef.current?.abort();
    setResult(null);
    setSourceData(null);
    setGenerateError("");
    setSaveError("");
    setGenerating(false);
  }

  return (
    <>
      <PageHeader
        eyebrow="INTELIGENCIA ARTIFICIAL"
        title="Redacción asistida"
        description="Transforma información original en títulos, resúmenes, guiones y cintillos para televisión."
      />

      {loadingCategories && (
        <LoadingState message="Preparando el editor con inteligencia artificial..." />
      )}

      {!loadingCategories && loadError && (
        <ErrorState
          message={loadError}
          onRetry={() =>
            setReloadKey(
              (currentValue) => currentValue + 1
            )
          }
        />
      )}

      {!loadingCategories &&
        !loadError &&
        categories.length === 0 && (
          <div className="form-alert" role="alert">
            Debes crear al menos una categoría antes de
            utilizar el editor con IA.
          </div>
        )}

      {!loadingCategories &&
        !loadError &&
        categories.length > 0 && (
          <div className="ai-editor-layout">
            <AiEditorForm
              generating={generating}
              error={generateError}
              onGenerate={handleGenerate}
            />

            {generating && (
              <div
                className="ai-generating-state"
                role="status"
                aria-live="polite"
              >
                <span className="ai-generating-icon">
                  IA
                </span>

                <div>
                  <h2>Preparando propuesta editorial</h2>

                  <p>
                    n8n está procesando la información con
                    inteligencia artificial. Esto puede tardar
                    algunos segundos.
                  </p>
                </div>
              </div>
            )}

            {saveError && (
              <div className="form-alert" role="alert">
                {saveError}
              </div>
            )}

            {result && !generating && (
              <AiResultPreview
                result={result}
                categories={categories}
                saving={saving}
                onChange={setResult}
                onSave={handleSave}
                onClear={handleClearResult}
              />
            )}
          </div>
        )}
    </>
  );
}

export default AiEditorPage;