import AccessControl "authorization/access-control";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinStorage "blob-storage/Mixin";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Migration "migration";

(with migration = Migration.run)
actor {
  include MixinStorage();

  public type SubjectScores = {
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

  public type BoardExamResults = {
    boardExamTotal : Nat;
    maxMarks : Nat;
    percentage : Nat;
  };

  public type AcademicEntry = {
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

  public type CodingAttempt = {
    challengeId : Nat;
    code : Text;
    result : Text;
    score : ?Nat;
    timestamp : Time.Time;
  };

  public type CodingChallenge = {
    id : Nat;
    title : Text;
    description : Text;
    sampleInput : Text;
    sampleOutput : Text;
  };

  public type UserProfile = { name : Text };

  public type SaveAcademicInput = {
    term : Nat;
    marks : SubjectScores;
    termMaxMarks : Nat;
    stream : ?Text;
    subgroup : ?Text;
    computerMaxMarks : Nat;
    aiMaxMarks : Nat;
  };

  public type AcademicEntriesExport = {
    academicEntries : [(Principal, [AcademicEntry])];
    boardExamResults : [(Principal, BoardExamResults)];
  };

  public type CodingExport = {
    challenges : [CodingChallenge];
    attempts : [(Principal, [CodingAttempt])];
  };

  public type ExportTypes = {
    academicEntries : AcademicEntriesExport;
    coding : CodingExport;
  };

  var accessControlState = AccessControl.initState();
  var nextChallengeId = 0;
  var academicEntries = Map.empty<Principal, List.List<AcademicEntry>>();
  var boardExamResults = Map.empty<Principal, BoardExamResults>();
  var codingAttempts = Map.empty<Principal, List.List<CodingAttempt>>();
  var codingChallenges = List.empty<CodingChallenge>();
  var userProfiles = Map.empty<Principal, UserProfile>();

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  func computeOverallMaxMarks(grade : Nat, termMaxMarks : Nat) : Nat {
    if (grade < 9 and termMaxMarks > 0) {
      termMaxMarks;
    } else if (grade == 9 and termMaxMarks > 0) {
      termMaxMarks * 2;
    } else if (grade == 10 and termMaxMarks > 0) {
      termMaxMarks * 2;
    } else if (termMaxMarks > 0) {
      termMaxMarks;
    } else { 0 };
  };

  public shared ({ caller }) func addAcademicEntry(grade : Nat, academicInputs : [SaveAcademicInput], _finalMarks : ?Nat) : async [AcademicEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add academic entries");
    };

    var academicEntriesList = List.empty<AcademicEntry>();
    let existingEntries = switch (academicEntries.get(caller)) {
      case (null) { List.empty<AcademicEntry>() };
      case (?entries) { entries };
    };

    for (input in academicInputs.values()) {
      let subjects = input.marks;
      let term = input.term;
      let termTotalMarks = calculateTermMarks(subjects);
      let termPercentage = calculateTermPercentage(termTotalMarks, input.termMaxMarks);
      let finalMarks = calculateFinalMarks(subjects, term);
      let overallMaxMarks = computeOverallMaxMarks(grade, input.termMaxMarks);
      let overallPercentage = if (overallMaxMarks > 0) {
        calculateTermPercentage(finalMarks, overallMaxMarks);
      } else { 0 };

      let computerMaxMarks = if (grade == 10 and term >= 8) { 80 } else {
        input.computerMaxMarks;
      };

      let aiMaxMarks = if (grade == 10 and term >= 8) { 25 } else {
        input.aiMaxMarks;
      };

      let entry : AcademicEntry = {
        grade;
        term;
        stream = input.stream;
        subgroup = input.subgroup;
        subjects;
        termTotalMarks;
        termMaxMarks = input.termMaxMarks;
        termPercentage;
        totalFinalMarks = finalMarks;
        overallMaxMarks;
        overallPercentage;
        combinedGradePercentage = calculateTermPercentage(finalMarks, input.termMaxMarks);
        gradeText = calculateGrade(termPercentage);
        timestamp = Time.now();
        maxMarksPerSubject = input.termMaxMarks;
        computerMaxMarks;
        aiMaxMarks;
      };

      academicEntriesList.add(entry);
      existingEntries.add(entry);
      academicEntries.add(caller, existingEntries);
    };

    academicEntriesList.toArray();
  };

  func calculateFinalMarks(subjects : SubjectScores, term : Nat) : Nat {
    var totalMarks = 0;
    if (term == 8 or term == 9) {
      totalMarks += switch (subjects.science) {
        case (?marks) { marks };
        case (null) { 0 };
      };
      totalMarks += switch (subjects.social) {
        case (?marks) { marks };
        case (null) { 0 };
      };
    };
    totalMarks;
  };

  func addSubjectMarks(totalMarks : Nat, subject : ?Nat) : Nat {
    switch (subject) {
      case (?marks) { totalMarks + marks };
      case (null) { totalMarks };
    };
  };

  func calculateTermMarks(subjects : SubjectScores) : Nat {
    var totalMarks = 0;
    totalMarks := addSubjectMarks(totalMarks, subjects.math);
    totalMarks := addSubjectMarks(totalMarks, subjects.english);
    totalMarks := addSubjectMarks(totalMarks, subjects.hindi);
    totalMarks := addSubjectMarks(totalMarks, subjects.evs);
    totalMarks := addSubjectMarks(totalMarks, subjects.computer);
    totalMarks := addSubjectMarks(totalMarks, subjects.kannada);
    totalMarks := addSubjectMarks(totalMarks, subjects.science);
    totalMarks := addSubjectMarks(totalMarks, subjects.social);
    totalMarks := addSubjectMarks(totalMarks, subjects.ai);
    totalMarks := addSubjectMarks(totalMarks, subjects.physics);
    totalMarks := addSubjectMarks(totalMarks, subjects.chemistry);
    totalMarks := addSubjectMarks(totalMarks, subjects.biology);
    totalMarks := addSubjectMarks(totalMarks, subjects.economics);
    totalMarks := addSubjectMarks(totalMarks, subjects.businessStudies);
    totalMarks := addSubjectMarks(totalMarks, subjects.accountancy);
    totalMarks := addSubjectMarks(totalMarks, subjects.statistics);
    totalMarks := addSubjectMarks(totalMarks, subjects.management);
    totalMarks := addSubjectMarks(totalMarks, subjects.psychology);
    totalMarks := addSubjectMarks(totalMarks, subjects.pe);
    totalMarks;
  };

  func calculateGrade(percentage : Nat) : Text {
    if (percentage >= 90) { "A+" } else if (percentage >= 80) {
      "A";
    } else if (percentage >= 70) {
      "B+";
    } else if (percentage >= 60) {
      "B";
    } else if (percentage >= 50) { "C" } else { "D" };
  };

  func calculateTermPercentage(termTotalMarks : Nat, termMaxMarks : Nat) : Nat {
    if (termMaxMarks > 0 and termTotalMarks > 0) {
      let percentage = (termTotalMarks * 100) / termMaxMarks;
      if (percentage > 100) { 100 } else { percentage };
    } else { 0 };
  };

  public shared ({ caller }) func saveBoardExamResults(boardExamTotal : Nat, maxMarks : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add academic entries");
    };
    let percentage = calculateTermPercentage(boardExamTotal, maxMarks);
    let boardResults : BoardExamResults = {
      boardExamTotal;
      maxMarks;
      percentage;
    };
    boardExamResults.add(caller, boardResults);
  };

  public query ({ caller }) func getAcademicEntries() : async [AcademicEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view academic entries");
    };
    switch (academicEntries.get(caller)) {
      case (null) { [] };
      case (?entries) { entries.reverse().values().toArray() };
    };
  };

  public query ({ caller }) func getBoardExamResults() : async BoardExamResults {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view academic entries");
    };
    switch (boardExamResults.get(caller)) {
      case (null) { Runtime.trap("No board exam results exist for the current user") };
      case (?boardExamResults) { boardExamResults };
    };
  };

  public query ({ caller }) func getAcademicEntriesByGradeAndTerm(grade : Nat, term : Nat) : async [AcademicEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view academic entries");
    };
    switch (academicEntries.get(caller)) {
      case (null) { [] };
      case (?entries) {
        let filteredEntries = entries.reverse().values().filter(
          func(entry) { entry.grade == grade and entry.term == term }
        ).toArray();
        filteredEntries;
      };
    };
  };

  public query ({ caller }) func getAcademicEntriesByGrade(grade : Nat) : async [AcademicEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view academic entries");
    };
    switch (academicEntries.get(caller)) {
      case (null) { [] };
      case (?entries) {
        let filteredEntries = entries.reverse().values().filter(
          func(entry) { entry.grade == grade }
        ).toArray();
        filteredEntries;
      };
    };
  };

  public query ({ caller }) func getCombinedAcademicEntriesByGrade(grade : Nat) : async {
    term1 : ?AcademicEntry;
    term2 : ?AcademicEntry;
    combinedTotal : Nat;
    combinedAverage : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view academic entries");
    };

    switch (academicEntries.get(caller)) {
      case (null) {
        {
          term1 = null;
          term2 = null;
          combinedTotal = 0;
          combinedAverage = 0;
        };
      };
      case (?entries) {
        var term1 : ?AcademicEntry = null;
        var term2 : ?AcademicEntry = null;
        var combinedTotal = 0;
        var combinedMaxMarks = 0;
        var termCount = 0;

        let filteredEntries = entries.values().filter(
          func(entry) { entry.grade == grade }
        ).toArray();

        for (entry in filteredEntries.values()) {
          if (entry.term == 1) { term1 := ?entry } else if (entry.term == 2) { term2 := ?entry };
          combinedTotal += entry.termTotalMarks;
          combinedMaxMarks += entry.termMaxMarks;
          termCount += 1;
        };

        let combinedAverage = (
          if (filteredEntries.size() > 0 and termCount > 0) {
            if (combinedMaxMarks > 0) {
              (combinedTotal * 100) / combinedMaxMarks;
            } else { 0 };
          } else { 0 }
        );

        {
          term1;
          term2;
          combinedTotal;
          combinedAverage;
        };
      };
    };
  };

  public shared ({ caller }) func saveCodingAttempt(challengeId : Nat, code : Text, result : Text, score : ?Nat) : async CodingAttempt {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save coding attempts");
    };

    let attempt : CodingAttempt = {
      challengeId;
      code;
      result;
      score;
      timestamp = Time.now();
    };

    let userAttempts = switch (codingAttempts.get(caller)) {
      case (null) { List.empty<CodingAttempt>() };
      case (?attempts) { attempts };
    };
    userAttempts.add(attempt);
    codingAttempts.add(caller, userAttempts);
    attempt;
  };

  public query ({ caller }) func getCodingAttempts() : async [CodingAttempt] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view coding attempts");
    };
    switch (codingAttempts.get(caller)) {
      case (null) { [] };
      case (?attempts) { attempts.reverse().values().toArray() };
    };
  };

  public shared ({ caller }) func addCodingChallenge(
    title : Text,
    description : Text,
    sampleInput : Text,
    sampleOutput : Text
  ) : async CodingChallenge {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can add coding challenge");
    };
    nextChallengeId += 1;
    let challenge : CodingChallenge = {
      id = nextChallengeId;
      title;
      description;
      sampleInput;
      sampleOutput;
    };
    codingChallenges.add(challenge);
    challenge;
  };

  public query ({ caller }) func getAllCodingChallenges() : async [CodingChallenge] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view coding challenges");
    };
    codingChallenges.values().toArray();
  };

  public query ({ caller }) func getCodingChallenge(id : Nat) : async CodingChallenge {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view coding challenges");
    };
    switch (codingChallenges.values().find(func(challenge) { challenge.id == id })) {
      case (null) { Runtime.trap("Challenge does not exist") };
      case (?challenge) { challenge };
    };
  };

  public query ({ caller }) func retrieveDataExportRequest(exportType : Text) : async ExportTypes {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can export data");
    };
    // Users should only export their own data, filter accordingly.
    let userAcademicEntries = switch (academicEntries.get(caller)) {
      case (null) { [] };
      case (?entries) { [(caller, entries.toArray())] };
    };
    let userBoardExamResults = switch (boardExamResults.get(caller)) {
      case (null) { [] };
      case (?results) { [(caller, results)] };
    };
    let academicExport : AcademicEntriesExport = {
      academicEntries = userAcademicEntries;
      boardExamResults = userBoardExamResults;
    };

    // Users should only export their own coding attempts, filter accordingly.
    let userCodingAttempts = switch (codingAttempts.get(caller)) {
      case (null) { [] };
      case (?attempts) { [(caller, attempts.toArray())] };
    };

    // Coding challenges are shared across all users.
    let codingExport : CodingExport = {
      challenges = codingChallenges.toArray();
      attempts = userCodingAttempts;
    };

    switch (exportType) {
      case ("academic-entries") {
        {
          academicEntries = academicExport;
          coding = { challenges = []; attempts = [] };
        };
      };
      case ("coding-attempts") {
        {
          academicEntries = { academicEntries = []; boardExamResults = [] };
          coding = codingExport;
        };
      };
      case ("full-export") {
        {
          academicEntries = academicExport;
          coding = codingExport;
        };
      };
      case (_) {
        let validTypes = "\"academic-entries\", \"coding-attempts\", \"full-export\"";
        Runtime.trap(
          "Invalid `exportType` request. Supported export types are: " # validTypes # ". You provided: "
          # exportType
        );
      };
    };
  };

  public shared ({ caller }) func importData(data : ExportTypes) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can import data");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    // Import academic entries
    if (not data.academicEntries.academicEntries.isEmpty() or not data.academicEntries.boardExamResults.isEmpty()) {
      for ((principal, entries) in data.academicEntries.academicEntries.values()) {
        // Users can only import their own data, admins can import for anyone
        if (principal == caller or isAdmin) {
          academicEntries.add(principal, List.fromArray<AcademicEntry>(entries));
        } else {
          Runtime.trap("Unauthorized: Users can only import their own data");
        };
      };
      for ((principal, results) in data.academicEntries.boardExamResults.values()) {
        // Users can only import their own data, admins can import for anyone
        if (principal == caller or isAdmin) {
          boardExamResults.add(principal, results);
        } else {
          Runtime.trap("Unauthorized: Users can only import their own data");
        };
      };
    };
    // Import coding data
    if (not data.coding.challenges.isEmpty() or not data.coding.attempts.isEmpty()) {
      // Only admins can import challenges (shared resource)
      if (not data.coding.challenges.isEmpty()) {
        if (not isAdmin) {
          Runtime.trap("Unauthorized: Only admins can import coding challenges");
        };
        codingChallenges.clear();
        codingChallenges.addAll(data.coding.challenges.values());
      };
      for ((principal, attempts) in data.coding.attempts.values()) {
        // Users can only import their own data, admins can import for anyone
        if (principal == caller or isAdmin) {
          codingAttempts.add(principal, List.fromArray<CodingAttempt>(attempts));
        } else {
          Runtime.trap("Unauthorized: Users can only import their own data");
        };
      };
    };
  };
};
