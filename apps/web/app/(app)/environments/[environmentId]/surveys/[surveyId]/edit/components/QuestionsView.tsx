"use client";

import HiddenFieldsCard from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/edit/components/HiddenFieldsCard";
import { createId } from "@paralleldrive/cuid2";
import { useEffect, useMemo, useState } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import toast from "react-hot-toast";

import { extractLanguageSymbols, translateQuestion } from "@formbricks/ee/multiLanguage/utils/i18n";
import { TProduct } from "@formbricks/types/product";
import { TSurvey, TSurveyQuestion } from "@formbricks/types/surveys";

import AddQuestionButton from "./AddQuestionButton";
import EditThankYouCard from "./EditThankYouCard";
import EditWelcomeCard from "./EditWelcomeCard";
import QuestionCard from "./QuestionCard";
import { StrictModeDroppable } from "./StrictModeDroppable";
import { isLabelValidForAllLanguages, validateQuestion } from "./Validation";

interface QuestionsViewProps {
  localSurvey: TSurvey;
  setLocalSurvey: (survey: TSurvey) => void;
  activeQuestionId: string | null;
  setActiveQuestionId: (questionId: string | null) => void;
  product: TProduct;
  invalidQuestions: String[] | null;
  setInvalidQuestions: (invalidQuestions: String[] | null) => void;
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
  languages: string[][];
}

export default function QuestionsView({
  activeQuestionId,
  setActiveQuestionId,
  localSurvey,
  setLocalSurvey,
  product,
  invalidQuestions,
  selectedLanguage,
  setInvalidQuestions,
  setSelectedLanguage,
  languages,
}: QuestionsViewProps) {
  const internalQuestionIdMap = useMemo(() => {
    return localSurvey.questions.reduce((acc, question) => {
      acc[question.id] = createId();
      return acc;
    }, {});
  }, [localSurvey.questions]);

  const [backButtonLabel, setbackButtonLabel] = useState(null);

  const handleQuestionLogicChange = (survey: TSurvey, compareId: string, updatedId: string): TSurvey => {
    survey.questions.forEach((question) => {
      if (!question.logic) return;
      question.logic.forEach((rule) => {
        if (rule.destination === compareId) {
          rule.destination = updatedId;
        }
      });
    });
    return survey;
  };

  // function to validate individual questions
  const validateSurvey = (question: TSurveyQuestion) => {
    // prevent this function to execute further if user hasnt still tried to save the survey
    if (invalidQuestions === null) {
      return;
    }
    let temp = JSON.parse(JSON.stringify(invalidQuestions));
    if (validateQuestion(question, extractLanguageSymbols(languages))) {
      temp = invalidQuestions.filter((id) => id !== question.id);
      setInvalidQuestions(temp);
    } else if (!invalidQuestions.includes(question.id)) {
      temp.push(question.id);
      setInvalidQuestions(temp);
    }
  };

  const updateQuestion = (questionIdx: number, updatedAttributes: any) => {
    let updatedSurvey = { ...localSurvey };

    if ("id" in updatedAttributes) {
      // if the survey whose id is to be changed is linked to logic of any other survey then changing it
      const initialQuestionId = updatedSurvey.questions[questionIdx].id;
      updatedSurvey = handleQuestionLogicChange(updatedSurvey, initialQuestionId, updatedAttributes.id);
      if (invalidQuestions?.includes(initialQuestionId)) {
        setInvalidQuestions(
          invalidQuestions.map((id) => (id === initialQuestionId ? updatedAttributes.id : id))
        );
      }

      // relink the question to internal Id
      internalQuestionIdMap[updatedAttributes.id] =
        internalQuestionIdMap[localSurvey.questions[questionIdx].id];
      delete internalQuestionIdMap[localSurvey.questions[questionIdx].id];
      setActiveQuestionId(updatedAttributes.id);
    }
    updatedSurvey.questions[questionIdx] = {
      ...updatedSurvey.questions[questionIdx],
      ...updatedAttributes,
    };

    if ("backButtonLabel" in updatedAttributes) {
      updatedSurvey.questions.forEach((question) => {
        question.backButtonLabel = updatedAttributes.backButtonLabel;
      });
      setbackButtonLabel(updatedAttributes.backButtonLabel);
    }
    setLocalSurvey(updatedSurvey);
    validateSurvey(updatedSurvey.questions[questionIdx]);
  };

  const deleteQuestion = (questionIdx: number) => {
    const questionId = localSurvey.questions[questionIdx].id;
    const activeQuestionIdTemp = activeQuestionId ?? localSurvey.questions[0].id;
    let updatedSurvey: TSurvey = { ...localSurvey };
    updatedSurvey.questions.splice(questionIdx, 1);
    updatedSurvey = handleQuestionLogicChange(updatedSurvey, questionId, "end");

    setLocalSurvey(updatedSurvey);
    delete internalQuestionIdMap[questionId];
    if (questionId === activeQuestionIdTemp) {
      if (questionIdx <= localSurvey.questions.length && localSurvey.questions.length > 0) {
        setActiveQuestionId(localSurvey.questions[questionIdx % localSurvey.questions.length].id);
      } else if (localSurvey.thankYouCard.enabled) {
        setActiveQuestionId("end");
      }
    }
    toast.success("Question deleted.");
  };

  const duplicateQuestion = (questionIdx: number) => {
    const questionToDuplicate = JSON.parse(JSON.stringify(localSurvey.questions[questionIdx]));

    const newQuestionId = createId();

    // create a copy of the question with a new id
    const duplicatedQuestion = {
      ...questionToDuplicate,
      id: newQuestionId,
    };

    // insert the new question right after the original one
    const updatedSurvey = { ...localSurvey };
    updatedSurvey.questions.splice(questionIdx + 1, 0, duplicatedQuestion);

    setLocalSurvey(updatedSurvey);
    setActiveQuestionId(newQuestionId);
    internalQuestionIdMap[newQuestionId] = createId();

    toast.success("Question duplicated.");
  };

  const addQuestion = (question: any) => {
    const updatedSurvey = { ...localSurvey };
    if (backButtonLabel) {
      question.backButtonLabel = backButtonLabel;
    }
    const translatedSurvey = translateQuestion(question);
    updatedSurvey.questions.push({ ...translatedSurvey, isDraft: true });

    setLocalSurvey(updatedSurvey);
    setActiveQuestionId(question.id);
    internalQuestionIdMap[question.id] = createId();
  };

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }
    const newQuestions = Array.from(localSurvey.questions);
    const [reorderedQuestion] = newQuestions.splice(result.source.index, 1);
    newQuestions.splice(result.destination.index, 0, reorderedQuestion);
    const updatedSurvey = { ...localSurvey, questions: newQuestions };
    setLocalSurvey(updatedSurvey);
  };

  const moveQuestion = (questionIndex: number, up: boolean) => {
    const newQuestions = Array.from(localSurvey.questions);
    const [reorderedQuestion] = newQuestions.splice(questionIndex, 1);
    const destinationIndex = up ? questionIndex - 1 : questionIndex + 1;
    newQuestions.splice(destinationIndex, 0, reorderedQuestion);
    const updatedSurvey = { ...localSurvey, questions: newQuestions };
    setLocalSurvey(updatedSurvey);
  };

  useEffect(() => {
    if (invalidQuestions === null) return;

    const languagesArray = languages.map((language) => language[0]);

    const isCardValid = (card, cardType) => {
      if (cardType === "start") {
        // welcomeCard identified as "start"
        return (
          isLabelValidForAllLanguages(card.headline, languagesArray) &&
          (card.html && card.html["en"] === ""
            ? true
            : isLabelValidForAllLanguages(card.html, languagesArray)) &&
          (card.buttonLabel && card.buttonLabel["en"] === ""
            ? true
            : isLabelValidForAllLanguages(card.buttonLabel, languagesArray))
        );
      } else if (cardType === "end") {
        // thankYouCard identified as "end"
        return (
          isLabelValidForAllLanguages(card.headline, languagesArray) &&
          (card.subheader && card.subheader["en"] === ""
            ? true
            : isLabelValidForAllLanguages(card.subheader, languagesArray))
        );
      }
      return true;
    };

    const updateInvalidQuestions = (card, cardId, currentInvalidQuestions) => {
      if (card.enabled && !isCardValid(card, cardId)) {
        return currentInvalidQuestions.includes(cardId)
          ? currentInvalidQuestions
          : [...currentInvalidQuestions, cardId];
      }
      return currentInvalidQuestions.filter((id) => id !== cardId);
    };

    const updatedQuestionsStart = updateInvalidQuestions(localSurvey.welcomeCard, "start", invalidQuestions);
    const updatedQuestionsEnd = updateInvalidQuestions(
      localSurvey.thankYouCard,
      "end",
      updatedQuestionsStart
    );

    setInvalidQuestions(updatedQuestionsEnd);
  }, [localSurvey.welcomeCard, localSurvey.thankYouCard]);

  return (
    <div className="px-5 py-4">
      <div className="mb-5 flex flex-col gap-5">
        <EditWelcomeCard
          localSurvey={localSurvey}
          setLocalSurvey={setLocalSurvey}
          setActiveQuestionId={setActiveQuestionId}
          activeQuestionId={activeQuestionId}
          isInValid={invalidQuestions ? invalidQuestions.includes("start") : false}
          languages={languages}
          setSelectedLanguage={setSelectedLanguage}
          selectedLanguage={selectedLanguage}
        />
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="mb-5 grid grid-cols-1 gap-5 ">
          <StrictModeDroppable droppableId="questionsList">
            {(provided) => (
              <div className="grid gap-5" ref={provided.innerRef} {...provided.droppableProps}>
                {localSurvey.questions.map((question, questionIdx) => (
                  // display a question form
                  <QuestionCard
                    key={internalQuestionIdMap[question.id]}
                    localSurvey={localSurvey}
                    product={product}
                    questionIdx={questionIdx}
                    moveQuestion={moveQuestion}
                    updateQuestion={updateQuestion}
                    duplicateQuestion={duplicateQuestion}
                    selectedLanguage={selectedLanguage}
                    setSelectedLanguage={setSelectedLanguage}
                    deleteQuestion={deleteQuestion}
                    activeQuestionId={activeQuestionId}
                    setActiveQuestionId={setActiveQuestionId}
                    lastQuestion={questionIdx === localSurvey.questions.length - 1}
                    isInValid={invalidQuestions ? invalidQuestions.includes(question.id) : false}
                    languages={languages}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </StrictModeDroppable>
        </div>
      </DragDropContext>
      <AddQuestionButton addQuestion={addQuestion} product={product} />
      <div className="mt-5 flex flex-col gap-5">
        <EditThankYouCard
          localSurvey={localSurvey}
          setLocalSurvey={setLocalSurvey}
          setActiveQuestionId={setActiveQuestionId}
          activeQuestionId={activeQuestionId}
          isInValid={invalidQuestions ? invalidQuestions.includes("end") : false}
          languages={languages}
          setSelectedLanguage={setSelectedLanguage}
          selectedLanguage={selectedLanguage}
        />

        {localSurvey.type === "link" ? (
          <HiddenFieldsCard
            localSurvey={localSurvey}
            setLocalSurvey={setLocalSurvey}
            setActiveQuestionId={setActiveQuestionId}
            activeQuestionId={activeQuestionId}
          />
        ) : null}
      </div>
    </div>
  );
}
