import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertCircle,
  Award,
  BookOpen,
  Calculator,
  FlaskConical,
  Info,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { SaveAcademicInput, Subjects } from "../backend";
import { useAddAcademicEntry } from "../hooks/useQueries";
import { computeAiSubstitution } from "../lib/boardExam";
import {
  calculateTermMaxMarks,
  getSubjectsForGrade,
  isBoardExamGrade,
} from "../lib/maxMarks";

type ElectiveMath = "maths" | "appliedMaths" | null;
type ScienceSubgroup = "PCM-Psych" | "PCMCs" | "PCMB" | null;
type CommerceSubgroup = "CEBA" | "SEBA" | null;

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const TERMS = [1, 2, 3];
const STREAMS = ["Science", "Commerce", "Arts"];

const SCIENCE_SUBGROUPS: {
  value: ScienceSubgroup;
  label: string;
  subjects: string;
}[] = [
  {
    value: "PCM-Psych",
    label: "PCM-Psych",
    subjects: "Physics, Chemistry, Maths, Psychology",
  },
  {
    value: "PCMCs",
    label: "PCMCs",
    subjects: "Physics, Chemistry, Maths, Computer Science",
  },
  {
    value: "PCMB",
    label: "PCMB",
    subjects: "Physics, Chemistry, Maths, Biology",
  },
];

const COMMERCE_SUBGROUPS: {
  value: CommerceSubgroup;
  label: string;
  subjects: string;
}[] = [
  {
    value: "CEBA",
    label: "CEBA",
    subjects: "Computer Science, Economics, Business Studies, Accountancy",
  },
  {
    value: "SEBA",
    label: "SEBA",
    subjects: "Statistics, Economics, Business Studies, Accountancy",
  },
];

function getScienceSubgroupSubjects(
  subgroup: ScienceSubgroup,
  maxMarks: number,
) {
  const base = [
    { name: "English", key: "english", maxMarks },
    { name: "Physics", key: "physics", maxMarks },
    { name: "Chemistry", key: "chemistry", maxMarks },
    { name: "Maths", key: "math", maxMarks },
  ];
  if (subgroup === "PCM-Psych") {
    base.push({ name: "Psychology", key: "psychology", maxMarks });
  } else if (subgroup === "PCMCs") {
    base.push({ name: "Computer Science", key: "computer", maxMarks });
  } else if (subgroup === "PCMB") {
    base.push({ name: "Biology", key: "biology", maxMarks });
  }
  base.push({ name: "Physical Education (Elective)", key: "pe", maxMarks });
  return base;
}

function getCommerceSubgroupSubjects(
  subgroup: CommerceSubgroup,
  maxMarks: number,
  electiveMath: ElectiveMath,
  isBoardExam: boolean,
) {
  const base: { name: string; key: string; maxMarks: number }[] = [
    { name: "English", key: "english", maxMarks },
  ];
  if (subgroup === "CEBA") {
    base.push({ name: "Computer Science", key: "computer", maxMarks });
    base.push({ name: "Economics", key: "economics", maxMarks });
    base.push({ name: "Business Studies", key: "businessStudies", maxMarks });
    base.push({ name: "Accountancy", key: "accountancy", maxMarks });
  } else if (subgroup === "SEBA") {
    base.push({ name: "Statistics", key: "statistics", maxMarks });
    base.push({ name: "Economics", key: "economics", maxMarks });
    base.push({ name: "Business Studies", key: "businessStudies", maxMarks });
    base.push({ name: "Accountancy", key: "accountancy", maxMarks });
  } else {
    base.push({ name: "Economics", key: "economics", maxMarks });
    base.push({ name: "Business Studies", key: "businessStudies", maxMarks });
    base.push({ name: "Accountancy", key: "accountancy", maxMarks });
  }

  if (!isBoardExam) {
    if (electiveMath === "maths") {
      base.push({ name: "Maths", key: "maths", maxMarks });
    } else if (electiveMath === "appliedMaths") {
      base.push({ name: "Applied Maths", key: "appliedMaths", maxMarks });
    }
  } else {
    if (electiveMath === "appliedMaths") {
      base.push({ name: "Applied Maths", key: "appliedMaths", maxMarks });
    } else {
      base.push({ name: "Maths", key: "maths", maxMarks });
    }
  }

  base.push({ name: "Physical Education (Elective)", key: "pe", maxMarks });
  return base;
}

export default function AddMarksForm({
  onSuccess,
}: { onSuccess?: () => void }) {
  const [selectedGrade, setSelectedGrade] = useState<number>(1);
  const [selectedTerm, setSelectedTerm] = useState<number>(1);
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [scienceSubgroup, setScienceSubgroup] = useState<ScienceSubgroup>(null);
  const [commerceSubgroup, setCommerceSubgroup] =
    useState<CommerceSubgroup>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [isBoardExam, setIsBoardExam] = useState(false);
  const [electiveMath, setElectiveMath] = useState<ElectiveMath>(null);
  const [boardExamMathChoice, setBoardExamMathChoice] = useState<
    "maths" | "appliedMaths"
  >("maths");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addEntryMutation = useAddAcademicEntry();

  const isHighSchool = selectedGrade >= 11;
  const isScienceStream = selectedStream === "Science";
  const isCommerceStream = selectedStream === "Commerce";
  const showScienceSubgroupSelector = isHighSchool && isScienceStream;
  const showCommerceSubgroupSelector = isHighSchool && isCommerceStream;
  const showElectiveMathSelector =
    isHighSchool && isCommerceStream && !isBoardExam;
  const showBoardExamMathChoice =
    isBoardExam && selectedGrade === 12 && isCommerceStream;
  const showBoardExamOption = isBoardExamGrade(selectedGrade);
  const showStreamSelector = selectedGrade >= 11;
  const isGrade10BoardExam = selectedGrade === 10 && isBoardExam;

  const effectiveElectiveMath: ElectiveMath = showElectiveMathSelector
    ? electiveMath
    : showBoardExamMathChoice
      ? boardExamMathChoice
      : null;

  const getSubjects = () => {
    if (isHighSchool && isScienceStream && scienceSubgroup) {
      return getScienceSubgroupSubjects(scienceSubgroup, 80);
    }
    if (isHighSchool && isCommerceStream) {
      const maxMarks = isBoardExam ? 100 : 80;
      return getCommerceSubgroupSubjects(
        commerceSubgroup,
        maxMarks,
        effectiveElectiveMath,
        isBoardExam,
      );
    }
    return getSubjectsForGrade(
      selectedGrade,
      selectedStream || undefined,
      isBoardExam,
      effectiveElectiveMath,
    );
  };

  const subjects = getSubjects();

  // Reset marks/errors whenever the subject list changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: resetting on subject configuration changes
  useEffect(() => {
    setMarks({});
    setErrors({});
  }, [
    selectedGrade,
    selectedStream,
    isBoardExam,
    electiveMath,
    boardExamMathChoice,
    scienceSubgroup,
    commerceSubgroup,
  ]);

  useEffect(() => {
    if (!showElectiveMathSelector) {
      setElectiveMath(null);
    }
  }, [showElectiveMathSelector]);

  // Reset subgroups when stream or grade changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: resetting on stream/grade configuration changes
  useEffect(() => {
    setScienceSubgroup(null);
    setCommerceSubgroup(null);
  }, [selectedStream, selectedGrade]);

  useEffect(() => {
    if (!isBoardExamGrade(selectedGrade)) {
      setIsBoardExam(false);
    }
    setSelectedStream("");
  }, [selectedGrade]);

  const handleMarkChange = (key: string, value: string) => {
    setMarks((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const e = { ...prev };
        delete e[key];
        return e;
      });
    }
  };

  const validateMarks = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const subject of subjects) {
      const val = marks[subject.key];
      if (val === undefined || val === "") continue;
      const num = Number(val);
      if (Number.isNaN(num) || num < 0) {
        newErrors[subject.key] = "Must be a non-negative number";
      } else if (num > subject.maxMarks) {
        newErrors[subject.key] = `Max is ${subject.maxMarks}`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildSubjectsPayload = (): Subjects => {
    const payload: Subjects = {};
    for (const subject of subjects) {
      const val = marks[subject.key];
      if (val !== undefined && val !== "") {
        const num = Math.min(Math.round(Number(val)), subject.maxMarks);
        (payload as Record<string, bigint>)[subject.key] = BigInt(num);
      }
    }
    return payload;
  };

  const getTermMaxMarks = (): number => {
    const activeKeys = subjects
      .filter((s) => marks[s.key] !== undefined && marks[s.key] !== "")
      .map((s) => s.key);
    if (activeKeys.length === 0) {
      return subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    }
    return calculateTermMaxMarks(activeKeys, selectedGrade, isBoardExam);
  };

  const getAiSubstitutionPreview = () => {
    if (!isGrade10BoardExam) return null;
    const mathVal = Number(marks.math || 0);
    const scienceVal = Number(marks.science || 0);
    const sscVal = Number(marks.ssc || 0);
    const aiVal = Number(marks.ai || 0);
    if (aiVal === 0) return null;
    return computeAiSubstitution(mathVal, scienceVal, sscVal, aiVal);
  };

  const aiPreview = getAiSubstitutionPreview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMarks()) return;

    const subjectsPayload = buildSubjectsPayload();
    const filledKeys = Object.keys(subjectsPayload);
    if (filledKeys.length === 0) {
      setErrors({ _form: "Please enter at least one subject mark" });
      return;
    }

    const termMaxMarks = getTermMaxMarks();

    // Determine computer and AI max marks
    const computerMaxMarks =
      subjects.find((s) => s.key === "computer")?.maxMarks ?? 0;
    const aiMaxMarks = subjects.find((s) => s.key === "ai")?.maxMarks ?? 0;
    const mathsMaxMarks =
      subjects.find((s) => s.key === "maths")?.maxMarks ?? 0;
    const appliedMathsMaxMarks =
      subjects.find((s) => s.key === "appliedMaths")?.maxMarks ?? 0;

    // Encode board exam metadata into scienceSubgroup for grade 10 board exam
    let encodedScienceSubgroup: string | undefined = undefined;
    let encodedCommerceSubgroup: string | undefined = undefined;

    if (isBoardExam && selectedGrade === 10) {
      // For grade 10 board exam, encode AI substitution info into scienceSubgroup
      const aiVal = Number(marks.ai || 0);
      if (aiVal > 0) {
        const mathVal = Number(marks.math || 0);
        const scienceVal = Number(marks.science || 0);
        const sscVal = Number(marks.ssc || 0);
        const sub = computeAiSubstitution(mathVal, scienceVal, sscVal, aiVal);
        if (sub) {
          encodedScienceSubgroup = `boardExam:${sub.substitutedSubject}`;
        }
      }
    } else if (scienceSubgroup) {
      encodedScienceSubgroup = scienceSubgroup;
    }

    if (commerceSubgroup) {
      encodedCommerceSubgroup = commerceSubgroup;
    }

    // Determine term number: board exam uses term 8 (grade 10) or 9 (grade 12)
    const termNumber = isBoardExam
      ? selectedGrade === 10
        ? 8
        : 9
      : selectedTerm;

    const input: SaveAcademicInput = {
      term: BigInt(termNumber),
      marks: subjectsPayload,
      marks9: undefined,
      stream: selectedStream || undefined,
      scienceSubgroup: encodedScienceSubgroup,
      commerceSubgroup: encodedCommerceSubgroup,
      termMaxMarks: BigInt(termMaxMarks),
      computerMaxMarks: BigInt(computerMaxMarks),
      aiMaxMarks: BigInt(aiMaxMarks),
      mathsMaxMarks: BigInt(mathsMaxMarks),
      appliedMathsMaxMarks: BigInt(appliedMathsMaxMarks),
    };

    try {
      await addEntryMutation.mutateAsync({
        grade: selectedGrade,
        inputs: [input],
        finalMarks: null,
      });
      setMarks({});
      setErrors({});
      onSuccess?.();
    } catch (err: any) {
      setErrors({
        _form: err?.message || "Failed to save marks. Please try again.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Add Academic Marks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grade & Term selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Grade</Label>
              <div className="flex flex-wrap gap-1">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGrade(g)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      selectedGrade === g
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {!isBoardExam && (
              <div className="space-y-2">
                <Label>Term</Label>
                <div className="flex gap-2">
                  {TERMS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTerm(t)}
                      className={`px-3 py-1 text-sm rounded border transition-colors ${
                        selectedTerm === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showStreamSelector && (
              <div className="space-y-2">
                <Label>Stream</Label>
                <div className="flex flex-wrap gap-1">
                  {STREAMS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedStream(s)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        selectedStream === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Board Exam toggle */}
          {showBoardExamOption && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="board-exam"
                checked={isBoardExam}
                onCheckedChange={(checked) => setIsBoardExam(!!checked)}
              />
              <Label
                htmlFor="board-exam"
                className="cursor-pointer flex items-center gap-1"
              >
                <Award className="w-4 h-4 text-amber-500" />
                Board Exam Mode
              </Label>
            </div>
          )}

          {/* Science Subgroup selector */}
          {showScienceSubgroupSelector && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <FlaskConical className="w-4 h-4" />
                Science Subgroup
              </Label>
              <div className="flex flex-wrap gap-2">
                {SCIENCE_SUBGROUPS.map((sg) => (
                  <button
                    key={sg.value}
                    type="button"
                    onClick={() => setScienceSubgroup(sg.value)}
                    className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                      scienceSubgroup === sg.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="font-medium">{sg.label}</span>
                    <span className="text-xs ml-1 opacity-70">
                      ({sg.subjects})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Commerce Subgroup selector */}
          {showCommerceSubgroupSelector && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <ShoppingBag className="w-4 h-4" />
                Commerce Subgroup
              </Label>
              <div className="flex flex-wrap gap-2">
                {COMMERCE_SUBGROUPS.map((sg) => (
                  <button
                    key={sg.value}
                    type="button"
                    onClick={() => setCommerceSubgroup(sg.value)}
                    className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                      commerceSubgroup === sg.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="font-medium">{sg.label}</span>
                    <span className="text-xs ml-1 opacity-70">
                      ({sg.subjects})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Elective Math selector (grades 11-12 Commerce, non-board-exam) */}
          {showElectiveMathSelector && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calculator className="w-4 h-4" />
                Maths Elective
              </Label>
              <RadioGroup
                value={electiveMath ?? ""}
                onValueChange={(v) => setElectiveMath(v as ElectiveMath)}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="maths" id="maths" />
                  <Label htmlFor="maths">Maths</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="appliedMaths" id="appliedMaths" />
                  <Label htmlFor="appliedMaths">Applied Maths</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Board Exam Math choice (grade 12 Commerce board exam) */}
          {showBoardExamMathChoice && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calculator className="w-4 h-4" />
                Board Exam Maths
              </Label>
              <RadioGroup
                value={boardExamMathChoice}
                onValueChange={(v) =>
                  setBoardExamMathChoice(v as "maths" | "appliedMaths")
                }
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="maths" id="be-maths" />
                  <Label htmlFor="be-maths">Maths</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="appliedMaths" id="be-appliedMaths" />
                  <Label htmlFor="be-appliedMaths">Applied Maths</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* AI Substitution Preview (Grade 10 Board Exam) */}
          {isGrade10BoardExam && aiPreview && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>AI Substitution:</strong> AI marks (
                {Number(marks.ai || 0)}) will substitute{" "}
                <strong>{aiPreview.substitutedSubject}</strong> if it improves
                your score.
              </AlertDescription>
            </Alert>
          )}

          {/* Subject Marks */}
          {subjects.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Subject Marks</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.map((subject) => (
                  <div key={subject.key} className="space-y-1">
                    <Label htmlFor={subject.key} className="text-sm">
                      {subject.name}
                      <span className="text-muted-foreground ml-1 text-xs">
                        / {subject.maxMarks}
                      </span>
                    </Label>
                    <Input
                      id={subject.key}
                      type="number"
                      min="0"
                      max={subject.maxMarks}
                      placeholder={`0–${subject.maxMarks}`}
                      value={marks[subject.key] ?? ""}
                      onChange={(e) =>
                        handleMarkChange(subject.key, e.target.value)
                      }
                      className={
                        errors[subject.key] ? "border-destructive" : ""
                      }
                    />
                    {errors[subject.key] && (
                      <p className="text-xs text-destructive">
                        {errors[subject.key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form-level error */}
          {errors._form && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors._form}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={addEntryMutation.isPending}
            className="w-full sm:w-auto"
          >
            {addEntryMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Marks"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
