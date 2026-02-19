import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    name: string;
}
export interface SubjectScores {
    ai?: bigint;
    pe?: bigint;
    evs?: bigint;
    biology?: bigint;
    social?: bigint;
    hindi?: bigint;
    math?: bigint;
    businessStudies?: bigint;
    computer?: bigint;
    economics?: bigint;
    chemistry?: bigint;
    accountancy?: bigint;
    physics?: bigint;
    management?: bigint;
    psychology?: bigint;
    kannada?: bigint;
    english?: bigint;
    statistics?: bigint;
    science?: bigint;
}
export type Time = bigint;
export interface AcademicEntriesExport {
    academicEntries: Array<[Principal, Array<AcademicEntry>]>;
    boardExamResults: Array<[Principal, BoardExamResults]>;
}
export interface AcademicEntry {
    totalFinalMarks: bigint;
    stream?: string;
    subjects: SubjectScores;
    term: bigint;
    gradeText: string;
    overallPercentage: bigint;
    subgroup?: string;
    maxMarksPerSubject: bigint;
    overallMaxMarks: bigint;
    grade: bigint;
    termMaxMarks: bigint;
    subjects9?: Score9Scale;
    timestamp: Time;
    termPercentage: bigint;
    computerMaxMarks: bigint;
    termTotalMarks: bigint;
    aiMaxMarks: bigint;
}
export interface BoardExamResults {
    maxMarks: bigint;
    boardExamTotal: bigint;
    percentage: bigint;
}
export interface Score9Scale {
    ai?: number;
    pe?: number;
    evs?: number;
    biology?: number;
    social?: number;
    hindi?: number;
    math?: number;
    businessStudies?: number;
    computer?: number;
    economics?: number;
    chemistry?: number;
    accountancy?: number;
    physics?: number;
    management?: number;
    psychology?: number;
    kannada?: number;
    english?: number;
    statistics?: number;
    science?: number;
}
export interface SaveAcademicInput {
    marks: SubjectScores;
    stream?: string;
    term: bigint;
    subgroup?: string;
    termMaxMarks: bigint;
    marks9?: Score9Scale;
    computerMaxMarks: bigint;
    aiMaxMarks: bigint;
}
export interface ExportTypes {
    academicEntries: AcademicEntriesExport;
    coding: CodingExport;
}
export interface GradeAggregate {
    term2Percentage: bigint;
    combinedOverallPercentage: bigint;
    term1Percentage: bigint;
}
export interface CodingAttempt {
    result: string;
    code: string;
    score?: bigint;
    challengeId: bigint;
    timestamp: Time;
}
export interface CodingExport {
    attempts: Array<[Principal, Array<CodingAttempt>]>;
    challenges: Array<CodingChallenge>;
}
export interface GradeAggregates {
    aggregates: Array<[bigint, GradeAggregate]>;
}
export interface CodingChallenge {
    id: bigint;
    title: string;
    sampleOutput: string;
    description: string;
    sampleInput: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAcademicEntry(grade: bigint, academicInputs: Array<SaveAcademicInput>, _finalMarks: bigint | null): Promise<Array<AcademicEntry>>;
    addCodingChallenge(title: string, description: string, sampleInput: string, sampleOutput: string): Promise<CodingChallenge>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAcademicEntries(): Promise<Array<AcademicEntry>>;
    getAcademicEntriesByGrade(grade: bigint): Promise<Array<AcademicEntry>>;
    getAcademicEntriesByGradeAndTerm(grade: bigint, term: bigint): Promise<Array<AcademicEntry>>;
    getAllCodingChallenges(): Promise<Array<CodingChallenge>>;
    getBoardExamResults(): Promise<BoardExamResults>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCodingAttempts(): Promise<Array<CodingAttempt>>;
    getCodingChallenge(id: bigint): Promise<CodingChallenge>;
    getCombinedAcademicEntriesByGrade(grade: bigint): Promise<{
        term1?: AcademicEntry;
        term2?: AcademicEntry;
        combinedTotal: bigint;
        combinedAverage: bigint;
    }>;
    getGradeAggregatePercentages(): Promise<GradeAggregates>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    importData(data: ExportTypes): Promise<void>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    retrieveDataExportRequest(exportType: string): Promise<ExportTypes>;
    saveBoardExamResults(boardExamTotal: bigint, maxMarks: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCodingAttempt(challengeId: bigint, code: string, result: string, score: bigint | null): Promise<CodingAttempt>;
}
