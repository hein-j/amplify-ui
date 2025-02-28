import { ActorRef, Interpreter, State } from 'xstate';
import {
  ValidationException,
  InternalServerException,
  ThrottlingException,
  ServiceQuotaExceededException,
  SessionInformation,
} from '@aws-sdk/client-rekognitionstreaming';

import {
  FaceLivenessDetectorProps,
  FaceMatchState,
  LivenessErrorState,
  LivenessOvalDetails,
  IlluminationState,
} from './liveness';
import {
  VideoRecorder,
  LivenessStreamProvider,
  FreshnessColorDisplay,
} from '../utils';
import { Face, FaceDetection } from './faceDetection';

export interface FaceMatchAssociatedParams {
  illuminationState: IlluminationState;
  faceMatchState: FaceMatchState;
  faceMatchPercentage: number;
  currentDetectedFace: Face;
  startFace: Face;
  endFace: Face;
  initialFaceMatchTime: number;
}

export interface FreshnessColorAssociatedParams {
  freshnessColorEl: HTMLCanvasElement;
  freshnessColors: string[];
  freshnessColorsComplete: boolean;
  freshnessColorDisplay: FreshnessColorDisplay;
}

export interface OvalAssociatedParams {
  faceDetector: FaceDetection;
  initialFace: Face;
  ovalDetails: LivenessOvalDetails;
  scaleFactor: number;
}

export interface VideoAssociatedParams {
  videoConstraints: MediaTrackConstraints;
  videoEl: HTMLVideoElement;
  canvasEl: HTMLCanvasElement;
  videoMediaStream: MediaStream;
  videoRecorder: VideoRecorder;
  recordingStartTimestampMs: number;
  isMobile: boolean | undefined;
}

export interface LivenessContext {
  maxFailedAttempts: number;
  failedAttempts: number;
  componentProps: FaceLivenessDetectorProps;
  serverSessionInformation: SessionInformation;
  challengeId: string;
  videoAssociatedParams: VideoAssociatedParams;
  ovalAssociatedParams: OvalAssociatedParams;
  faceMatchAssociatedParams: FaceMatchAssociatedParams;
  freshnessColorAssociatedParams: FreshnessColorAssociatedParams;
  errorState: LivenessErrorState | null;
  livenessStreamProvider: LivenessStreamProvider;
  responseStreamActorRef: ActorRef<any>;
  shouldDisconnect: boolean | undefined;
  faceMatchStateBeforeStart: FaceMatchState;
  isFaceFarEnoughBeforeRecording: boolean;
  isRecordingStopped: boolean;
}

export type LivenessEventTypes =
  | 'BEGIN'
  | 'START_RECORDING'
  | 'TIMEOUT'
  | 'ERROR'
  | 'CANCEL'
  | 'SET_SESSION_INFO'
  | 'DISCONNECT_EVENT'
  | 'SET_DOM_AND_CAMERA_DETAILS'
  | 'SERVER_ERROR'
  | 'RETRY_CAMERA_CHECK'
  | 'MOBILE_LANDSCAPE_WARNING';

export type LivenessEventData = Record<PropertyKey, any>; // TODO: this should be typed further

export interface LivenessEvent {
  type: LivenessEventTypes;
  data?: LivenessEventData;
}

export type LivenessMachineState = State<LivenessContext, LivenessEvent>;

export type LivenessInterpreter = Interpreter<
  LivenessContext,
  any,
  LivenessEvent,
  any,
  any
>;

export interface StreamActorCallback {
  (params: { type: 'DISCONNECT_EVENT' }): void;
  (params: { type: 'SERVER_ERROR'; data: { error: Error } }): void;
  (params: {
    type: 'SERVER_ERROR';
    data: { error: ValidationException };
  }): void;
  (params: {
    type: 'SERVER_ERROR';
    data: { error: InternalServerException };
  }): void;
  (params: {
    type: 'SERVER_ERROR';
    data: { error: ThrottlingException };
  }): void;
  (params: {
    type: 'SERVER_ERROR';
    data: { error: ServiceQuotaExceededException };
  }): void;
  (params: {
    type: 'SET_SESSION_INFO';
    data: { sessionInfo: SessionInformation | undefined };
  }): void;
}
