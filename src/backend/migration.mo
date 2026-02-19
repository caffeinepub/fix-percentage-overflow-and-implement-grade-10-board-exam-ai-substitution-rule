import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Nat8 "mo:core/Nat8";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Text "mo:core/Text";

module {
  type OldSubjectScores = {
    math : ?Nat;
    english : ?Nat;
    hindi : ?Nat;
    evs : ?Nat;
    computer : ?Nat;
    kannada : ?Nat;
    science : ?Nat;
    social : ?Nat;
    ai : ?Nat;
    physics : ?Nat;
    chemistry : ?Nat;
    biology : ?Nat;
    economics : ?Nat;
    businessStudies : ?Nat;
    accountancy : ?Nat;
    statistics : ?Nat;
    management : ?Nat;
    psychology : ?Nat;
    pe : ?Nat;
  };

  type OldScore9Scale = {
    math : ?Nat8;
    english : ?Nat8;
    hindi : ?Nat8;
    evs : ?Nat8;
    computer : ?Nat8;
    kannada : ?Nat8;
    science : ?Nat8;
    social : ?Nat8;
    ai : ?Nat8;
    physics : ?Nat8;
    chemistry : ?Nat8;
    biology : ?Nat8;
    economics : ?Nat8;
    businessStudies : ?Nat8;
    accountancy : ?Nat8;
    statistics : ?Nat8;
    management : ?Nat8;
    psychology : ?Nat8;
    pe : ?Nat8;
  };

  type OldBoardExamResults = {
    boardExamTotal : Nat;
    maxMarks : Nat;
    percentage : Nat;
  };

  type OldAcademicEntry = {
    grade : Nat;
    term : Nat;
    stream : ?Text;
    subgroup : ?Text;
    subjects : OldSubjectScores;
    subjects9 : ?OldScore9Scale;
    termTotalMarks : Nat;
    termMaxMarks : Nat;
    termPercentage : Nat;
    totalFinalMarks : Nat;
    overallMaxMarks : Nat;
    overallPercentage : Nat;
    gradeText : Text;
    timestamp : Time.Time;
    maxMarksPerSubject : Nat;
    computerMaxMarks : Nat;
    aiMaxMarks : Nat;
  };

  type OldCodingAttempt = {
    challengeId : Nat;
    code : Text;
    result : Text;
    score : ?Nat;
    timestamp : Time.Time;
  };

  type OldCodingChallenge = {
    id : Nat;
    title : Text;
    description : Text;
    sampleInput : Text;
    sampleOutput : Text;
  };

  type OldUserProfile = { name : Text };

  type OldExportTypes = {
    academicEntries : OldAcademicEntriesExport;
    coding : OldCodingExport;
  };

  type OldAcademicEntriesExport = {
    academicEntries : [(Principal, [OldAcademicEntry])];
    boardExamResults : [(Principal, OldBoardExamResults)];
  };

  type OldCodingExport = {
    challenges : [OldCodingChallenge];
    attempts : [(Principal, [OldCodingAttempt])];
  };

  type OldGradeAggregate = {
    term1Percentage : Nat;
    term2Percentage : Nat;
    combinedOverallPercentage : Nat;
  };

  type OldGradeAggregates = {
    aggregates : [(Nat, OldGradeAggregate)];
  };

  type OldActor = {
    academicEntries : Map.Map<Principal, List.List<OldAcademicEntry>>;
    boardExamResults : Map.Map<Principal, OldBoardExamResults>;
    codingAttempts : Map.Map<Principal, List.List<OldCodingAttempt>>;
    codingChallenges : List.List<OldCodingChallenge>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewActor = {
    academicEntries : Map.Map<Principal, List.List<OldAcademicEntry>>;
    boardExamResults : Map.Map<Principal, OldBoardExamResults>;
    codingAttempts : Map.Map<Principal, List.List<OldCodingAttempt>>;
    codingChallenges : List.List<OldCodingChallenge>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type SubjectScores = {
    math : ?Nat;
    english : ?Nat;
    hindi : ?Nat;
    evs : ?Nat;
    computer : ?Nat;
    kannada : ?Nat;
    science : ?Nat;
    social : ?Nat;
    ai : ?Nat;
    physics : ?Nat;
    chemistry : ?Nat;
    biology : ?Nat;
    economics : ?Nat;
    businessStudies : ?Nat;
    accountancy : ?Nat;
    statistics : ?Nat;
    management : ?Nat;
    psychology : ?Nat;
    pe : ?Nat;
  };

  type Score9Scale = {
    math : ?Nat8;
    english : ?Nat8;
    hindi : ?Nat8;
    evs : ?Nat8;
    computer : ?Nat8;
    kannada : ?Nat8;
    science : ?Nat8;
    social : ?Nat8;
    ai : ?Nat8;
    physics : ?Nat8;
    chemistry : ?Nat8;
    biology : ?Nat8;
    economics : ?Nat8;
    businessStudies : ?Nat8;
    accountancy : ?Nat8;
    statistics : ?Nat8;
    management : ?Nat8;
    psychology : ?Nat8;
    pe : ?Nat8;
  };

  func calculate9ScaleScore(marks : Nat) : Nat8 {
    let safeMarks = if (marks > 100) { 100 } else { marks };
    if (safeMarks >= 91) { 9 : Nat8 } else if (safeMarks >= 81) {
      8 : Nat8;
    } else if (safeMarks >= 71) {
      7 : Nat8;
    } else if (safeMarks >= 61) {
      6 : Nat8;
    } else if (safeMarks >= 51) { 5 : Nat8 } else if (safeMarks >= 41) {
      4 : Nat8;
    } else if (safeMarks >= 33) {
      3 : Nat8;
    } else if (safeMarks >= 21) {
      2 : Nat8;
    } else if (safeMarks >= 11) {
      1 : Nat8;
    } else {
      0 : Nat8;
    };
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
