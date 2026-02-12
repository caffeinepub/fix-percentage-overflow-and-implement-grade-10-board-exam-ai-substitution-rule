import AccessControl "authorization/access-control";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";

module {
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

  type BoardExamResults = {
    boardExamTotal : Nat;
    maxMarks : Nat;
    percentage : Nat;
  };

  type AcademicEntry = {
    grade : Nat;
    term : Nat;
    stream : ?Text;
    subgroup : ?Text;
    subjects : SubjectScores;
    termTotalMarks : Nat;
    termMaxMarks : Nat;
    termPercentage : Nat;
    totalFinalMarks : Nat;
    overallMaxMarks : Nat;
    overallPercentage : Nat;
    combinedGradePercentage : Nat;
    gradeText : Text;
    timestamp : Time.Time;
    maxMarksPerSubject : Nat;
    computerMaxMarks : Nat;
    aiMaxMarks : Nat;
  };

  type CodingAttempt = {
    challengeId : Nat;
    code : Text;
    result : Text;
    score : ?Nat;
    timestamp : Time.Time;
  };

  type CodingChallenge = {
    id : Nat;
    title : Text;
    description : Text;
    sampleInput : Text;
    sampleOutput : Text;
  };

  type UserProfile = { name : Text };

  type AcademicEntriesExport = {
    academicEntries : [(Principal, [AcademicEntry])];
    boardExamResults : [(Principal, BoardExamResults)];
  };

  type CodingExport = {
    challenges : [CodingChallenge];
    attempts : [(Principal, [CodingAttempt])];
  };

  type ExportTypes = {
    academicEntries : AcademicEntriesExport;
    coding : CodingExport;
  };

  // Original actor type before migration
  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    nextChallengeId : Nat;
    academicEntries : Map.Map<Principal, List.List<AcademicEntry>>;
    boardExamResults : Map.Map<Principal, BoardExamResults>;
    codingAttempts : Map.Map<Principal, List.List<CodingAttempt>>;
    codingChallenges : List.List<CodingChallenge>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  // New actor type after migration
  type NewActor = OldActor;

  public func run(old : OldActor) : NewActor {
    let normalizedAcademicEntriesMap = old.academicEntries.map<Principal, List.List<AcademicEntry>, List.List<AcademicEntry>>(
      func(_principal, entries) {
        entries.map(
          func(entry) {
            let correctMaxMarksPerSubject = switch (entry.grade) {
              case (9) { 80 };
              case (10) { 80 };
              case (12) {
                if (entry.termMaxMarks >= 60 and entry.termMaxMarks <= 100) {
                  entry.termMaxMarks;
                } else { 0 };
              };
              case (_) {
                if (entry.termMaxMarks <= 50) { entry.termMaxMarks } else {
                  0;
                };
              };
            };
            if (correctMaxMarksPerSubject != entry.maxMarksPerSubject) {
              {
                entry with
                maxMarksPerSubject = correctMaxMarksPerSubject
              };
            } else { entry };
          }
        );
      }
    );
    { old with academicEntries = normalizedAcademicEntriesMap };
  };
};
