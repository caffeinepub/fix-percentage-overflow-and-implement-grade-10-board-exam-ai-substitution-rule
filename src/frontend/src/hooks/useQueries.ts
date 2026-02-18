import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Principal } from '@icp-sdk/core/principal';
import type { AcademicEntry, BoardExamResults, CodingAttempt, CodingChallenge, UserProfile, UserRole, SubjectScores, ExportTypes, GradeAggregates } from '../backend';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { principal: string; role: UserRole }) => {
      if (!actor) throw new Error('Actor not initialized');
      const principal = Principal.fromText(params.principal);
      return actor.assignCallerUserRole(principal, params.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useGetAcademicEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<AcademicEntry[]>({
    queryKey: ['academicEntries'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAcademicEntries();
    },
    enabled: !!actor && !isFetching,
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

export function useGetAcademicEntriesByGradeAndTerm(grade: number, term: number) {
  const { actor, isFetching } = useActor();

  return useQuery<AcademicEntry[]>({
    queryKey: ['academicEntries', 'byGradeAndTerm', grade, term],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAcademicEntriesByGradeAndTerm(BigInt(grade), BigInt(term));
    },
    enabled: !!actor && !isFetching,
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

export function useGetCombinedAcademicEntriesByGrade(grade: number) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['academicEntries', 'combined', grade],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCombinedAcademicEntriesByGrade(BigInt(grade));
    },
    enabled: !!actor && !isFetching,
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

export function useGetGradeAggregatePercentages() {
  const { actor, isFetching } = useActor();

  return useQuery<GradeAggregates>({
    queryKey: ['gradeAggregates'],
    queryFn: async () => {
      if (!actor) return { aggregates: [] };
      return actor.getGradeAggregatePercentages();
    },
    enabled: !!actor && !isFetching,
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

export function useGetBoardExamResults() {
  const { actor, isFetching } = useActor();

  return useQuery<BoardExamResults | null>({
    queryKey: ['boardExamResults'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getBoardExamResults();
      } catch (error) {
        // No board exam results exist yet
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

export function useAddAcademicEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      grade: number;
      term: number;
      stream: string | null;
      subgroup: string | null;
      marks: SubjectScores;
      termMaxMarks: number;
      computerMaxMarks: number;
      aiMaxMarks: number;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      const academicInputs = [{
        term: BigInt(params.term),
        marks: params.marks,
        stream: params.stream || undefined,
        subgroup: params.subgroup || undefined,
        termMaxMarks: BigInt(params.termMaxMarks),
        computerMaxMarks: BigInt(params.computerMaxMarks),
        aiMaxMarks: BigInt(params.aiMaxMarks),
      }];
      
      const results = await actor.addAcademicEntry(
        BigInt(params.grade),
        academicInputs,
        BigInt(params.termMaxMarks)
      );
      
      return results[0];
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['academicEntries'] });
      await queryClient.invalidateQueries({ queryKey: ['gradeAggregates'] });
      await queryClient.refetchQueries({ queryKey: ['academicEntries'] });
      await queryClient.refetchQueries({ queryKey: ['gradeAggregates'] });
    },
  });
}

export function useSaveBoardExamResults() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      boardExamTotal: number;
      maxMarks: number;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveBoardExamResults(
        BigInt(params.boardExamTotal),
        BigInt(params.maxMarks)
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['boardExamResults'] });
      await queryClient.refetchQueries({ queryKey: ['boardExamResults'] });
    },
  });
}

export function useGetCodingChallenges() {
  const { actor, isFetching } = useActor();

  return useQuery<CodingChallenge[]>({
    queryKey: ['codingChallenges'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCodingChallenges();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCodingAttempts() {
  const { actor, isFetching } = useActor();

  return useQuery<CodingAttempt[]>({
    queryKey: ['codingAttempts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCodingAttempts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCodingAttempt() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attempt: {
      challengeId: bigint;
      code: string;
      result: string;
      score: number | null;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveCodingAttempt(
        attempt.challengeId,
        attempt.code,
        attempt.result,
        attempt.score !== null ? BigInt(attempt.score) : null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codingAttempts'] });
    },
  });
}

export function useAddCodingChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challenge: {
      title: string;
      description: string;
      sampleInput: string;
      sampleOutput: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addCodingChallenge(
        challenge.title,
        challenge.description,
        challenge.sampleInput,
        challenge.sampleOutput
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codingChallenges'] });
    },
  });
}

export function useExportData() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (exportType: 'academic-entries' | 'coding-attempts' | 'full-export') => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.retrieveDataExportRequest(exportType);
    },
  });
}

export function useImportData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ExportTypes) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.importData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicEntries'] });
      queryClient.invalidateQueries({ queryKey: ['boardExamResults'] });
      queryClient.invalidateQueries({ queryKey: ['codingAttempts'] });
      queryClient.invalidateQueries({ queryKey: ['codingChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['gradeAggregates'] });
    },
  });
}
