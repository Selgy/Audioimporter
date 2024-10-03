/**
 * The TypeReflection object provides information about the behavior of type of a property.
 */
declare class TypeReflection {
    readonly ArrayType: boolean;
    readonly name: string;
    readonly optionalType: boolean;
  }
  
  /**
  * UPXHost class provides private functionality to interact with the host from the plugin
  */
  declare class UXPHost {
    getNamespacesForPluginId(pluginId: string): Array<any>;
  }
  
  /**
  * The SystemInfo object provides information about the system.
  */
  declare class SystemInfo {
    readonly os: OSInfo;
  }
  
  /**
  * Scripting methods to the BatchItem
  */
  declare class BatchItem {
    readonly encodingTime: number;
    readonly groupID: string;
    readonly id: string;
    readonly logOutput: string;
    readonly outputInfo: string;
    readonly progress: number;
    readonly promise: Object;
    readonly status: number;
  }
  
  /**
  * Batch event object
  */
  declare class BatchEvent {
    readonly BATCHGROUPINSERTED: string;
    readonly BATCHGROUPREMOVED: string;
    readonly BATCHITEMINSERTED: string;
    readonly BATCHITEMREMOVED: string;
    readonly batchGroupID: string;
    readonly batchItemID: string;
    addEventListener(): any;
    removeEventListener(): any;
    dispatchEvent(): any;
  }
  
  /**
  * Scripting methods to batch encoder
  */
  declare class BatchEncoderScriptObject {
  }
  
  /**
  * BatchEncoder event object
  */
  declare class BatchEncoderEvent {
    readonly EVENTENCODERSTATUSCHANGED: string;
    readonly EVENTENCODINGITEMDESCRIPTION: string;
    readonly EVENTENCODINGITEMEVENT: string;
    readonly EVENTENCODINGITEMPROGRESSUPDATE: string;
    readonly EVENTENCODINGITEMSTARTED: string;
    readonly EVENTENCODINGCOMPLETE: string;
    readonly EVENTENCODINGPAUSEDITEMSTARTED: string;
    readonly EVENTENCODINGPOSTOPERATIONPROGRESS: string;
    readonly EVENTENCODINGPREOPERATIONPROGRESS: string;
    readonly EVENTMEDIAINFOCREATED: string;
    readonly allowMoveSource: boolean;
    readonly batchItem: Object;
    readonly eventFlag: number;
    readonly progress: number;
    readonly textMessage: string;
    addEventListener(): any;
    removeEventListener(): any;
    dispatchEvent(): any;
  }
  
  /**
  * Scripting methods to the Batch Encoder
  */
  declare class BatchEncoder {
    readonly PROGRESSCATEGORYID: any;
    readonly batchItemGroups: Array<any>;
    readonly progress: number;
    readonly status: any;
    readonly useBackgroundRendering: boolean;
    clearAll(): boolean;
    encodeItem(inSequenceID: number, inPresetFile: string, inOutputFile: string): Object;
    encodeSequence(inSequence: Object, inPresetFilePath: string, inOutputFilePath: string): Object;
    pause(): boolean;
    removeItem(inBatchGroupID: string, inBatchItemID: string): boolean;
    start(): boolean;
    startListening(): boolean;
    stop(): boolean;
    stopCurrent(): boolean;
    addEventListener(): any;
    removeEventListener(): any;
    dispatchEvent(): any;
  }
  
  /**
  * Scripting methods to the Batch
  */
  declare class Batch {
    startListening(): boolean;
    addEventListener(): any;
    removeEventListener(): any;
    dispatchEvent(): any;
  }
  
  /**
  * Scripting methods to the Batch Item Group
  */
  declare class BatchItemGroup {
    readonly batchItems: Array<any>;
    readonly combinedProgress: number;
    readonly combinedStatus: number;
    readonly id: string;
    readonly postProcessorItemsJSON: string;
    readonly sourceInfo: string;
  }
  
  /**
  * Event will be triggered when the active sequence has been changed
  */
  declare class ActiveSequenceChangedEventObject {
  }
  
  /**
  * Event will be triggered when the active sequence selection has been changed
  */
  declare class ActiveSequenceSelectionChangedEventObject {
  }
  
  /**
  * Event will be triggered when track(s) added to and/or removed from sequence.
  */
  declare class ActiveSequenceStructureChangedEventObject {
  }
  
  /**
  * Event will be triggered when a track item has been added.
  */
  declare class ActiveSequenceTrackItemAddedEventObject {
    readonly track: Track;
    readonly trackItemAdded: TrackItem;
  }
  
  /**
  * Event will be triggered when a track item has been removed.
  */
  declare class ActiveSequenceTrackItemRemovedEventObject {
    readonly track: Track;
    readonly trackItemRemoved: TrackItem;
  }
  
  /**
  * BetaFeature class
  */
  declare class BetaFeature {
    readonly FEATUREFLAGOVERRIDEDEFAULT: number;
    readonly FEATUREFLAGOVERRIDEOFF: number;
    readonly FEATUREFLAGOVERRIDEON: number;
    readonly isEntitlementSetToInternalFeaturesAllowed: boolean;
    isFeatureEnabled(featureID: string): boolean;
    setFeatureFlagOverride(featureID: string, unnamed_1?: number): boolean;
  }
  
  /**
  * DebugMonitor script object
  */
  declare class DebugMonitor {
    DebugMonitor(): DebugMonitor;
    closeCategory(categoryId: string): boolean;
    getDebugInformation(categoryId: string): string;
    getDebugMonitorCategories(): any;
    getOpenedListDebugInfo(): any;
    openCategory(categoryId: string): boolean;
  }
  
  /**
  * DebugDatabase class provides access to debug database.
  */
  declare class DebugDatabase {
    get(key: string): string;
    getDebugFlagMasterList(): any;
    getDefault(key: string): string;
    getOrDefaultBoolValue(key: string, defaultValue: boolean): boolean;
    getOrDefaultValue(key: string, defaultValue: string): string;
    hasKey(key: string): boolean;
    isDefault(key: string): boolean;
    set(key: string, value: string): boolean;
  }
  
  /**
  * DebugAssert class provides the ability to log debug asserts in scripting.
  */
  declare class DebugAssert {
    getLog(): Array<any>;
    startLog(): boolean;
  }
  
  /**
  * A random GUID
  */
  declare class Guid {
    Guid(): Guid;
    createUnique(): Guid;
    fromString(stringValue: string): Guid;
    equals(Guid: Object): boolean;
    toString(): string;
  }
  
  /**
  * Event will be triggered after authentication success.
  */
  declare class EAObjectOnAuthenticationSuccessEvent {
  }
  
  /**
  * Event will be triggered after authentication failure.
  */
  declare class EAObjectOnAuthenticationFailureEvent {
  }
  
  /**
  * EA class
  */
  declare class QEEA {
    readonly isAdministrator: boolean;
    benchmarkReflectEverything(): number;
    canShare(): number;
    closeProduction(p0: string): boolean;
    convertProductionIntoProject(p0: string): boolean;
    convertProjectIntoProduction(p0: string, p1: string, p2: boolean, p3: string, p4: boolean): boolean;
    createProduction(p0: string, p1: string, p2: boolean, p3: string, p4: string, p5: boolean): Object;
    doesEditingSessionHaveLocalMedia(): boolean;
    doesProjectHaveUnsharedChanges(): boolean;
    fetchIMSAccessToken(clientID: string, clientSecret: string, scope: string): string;
    getAdminInterface(): Object;
    getArchivedProductionList(): Array<any>;
    getConflicts(): Array<any>;
    getCreativeCloudIdentity(): Object;
    getDiscoveryURL(): string;
    getInviteList(): Array<any>;
    getLoggedInDataServerVersion(): string;
    getProcessID(): string;
    getProductionByID(productionIdentifier: string): Object;
    getProductionList(): Array<any>;
    getRemoteServerBuildVersion(): string;
    getSessionSyncStatus(): string;
    getUserEmail(): string;
    getUsername(): string;
    isCollaborationOnly(): boolean;
    isConvertProductionIntoProjectRunning(): boolean;
    isConvertProjectIntoProductionRunning(): boolean;
    isHostedCollaborationOnly(): boolean;
    isLoggedIn(): boolean;
    isShareCommandEnabled(): boolean;
    isSyncCommandEnabled(): boolean;
    openCleanSandbox(productionIdentifier: string): boolean;
    openProduction(p0: string): boolean;
    renameProduction(p0: string): boolean;
    resolveConflict(p0: Object, p1: Object): boolean;
    saveProductionAs(p0: string, p1: string): boolean;
    setAuthToken(p0: string, p1: string, p2: string): number;
    setLocalHubConnectionStatus(p0: number): boolean;
    setMediaCachePath(p0: string): boolean;
    share(p0: string): boolean;
    sync(): boolean;
    waitForCurrentReflectionToComplete(): boolean;
  }
  
  /**
  * Event will be triggered when EA login completes.
  */
  declare class EALoginCompletedEventObject {
    readonly eaLoginResult: boolean;
  }
  
  /**
  * Provides the following event types: onMediaInfoCreated, onBatchItemStatusChanged, onItemEncodingStarted, onAudioPreEncodeProgress, onEncodingItemProgressUpdated, onEncodeComplete, onError, onPostProcessListInitialized
  */
  declare class AMEExportEvent {
    readonly oEncodingItemProgressUpdated: string;
    readonly onAudioPreEncodeProgress: string;
    readonly onBatchItemStatusChanged: string;
    readonly onEncodeComplete: string;
    readonly onEncodingItemProgressUpdated: string;
    readonly onError: string;
    readonly onItemEncodingStarted: string;
    readonly onMediaInfoCreated: string;
    readonly onPostProcessListInitialized: string;
    readonly audioInfo: string;
    readonly audioProgress: number;
    readonly encodeCompleteStatus: boolean;
    readonly encodeCompleteTime: number;
    readonly groupIndex: number;
    readonly itemIndex: number;
    readonly progress: number;
    readonly status: any;
    addEventListener(): any;
    removeEventListener(): any;
    dispatchEvent(): any;
  }
  
  /**
  * ZString class provides access to localized version of a string.
  */
  declare class ZString {
    getZString(locKey: string): string;
    getZStringAndReplace(locKey: string, stringSubstitutions: Array<any>): string;
  }
  
  /**
  * The CEScriptObject object provides access to API's of Cloud Export Client.
  */
  declare class CEScriptObject {
    readonly CEVALIDATIONTYPECUSTOMLUT: number;
    readonly CEVALIDATIONTYPECUSTOMPLUGIN: number;
    readonly CEVALIDATIONTYPEFRAMEASSET: number;
    readonly CEVALIDATIONTYPEFRAMENONSYNCASSET: number;
    readonly CEVALIDATIONTYPELOCALASSET: number;
    readonly CEVALIDATIONTYPEMOGRT: number;
    readonly CEVALIDATIONTYPENONTYPEKITFONT: number;
    readonly CEVALIDATIONTYPEOTHERS: number;
    getCustomPresetFilePath(): string;
    replaceUnsupportedFontsInSequence(sequence: Object): Object;
    submitSequence(sequence: Object, pathToAccess: string): Object;
    validateSequence(sequence: Object): Object;
    addEventListener(): any;
    removeEventListener(): any;
    dispatchEvent(): any;
  }
  
  /**
  * The ClientInfo object provides information about the application.
  */
  declare class ClientInfo {
    readonly application: string;
    readonly betaPrime: boolean;
    readonly build: string;
    readonly client: string;
    readonly company: string;
    readonly patch: string;
    readonly scriptingHost: string;
    readonly version: string;
    readonly versionInternal: string;
  }
  
  /**
  * AudioChannelMapping class
  */
  declare class AudioChannelMapping {
    audioChannelsType: number;
    audioClipsNumber: number;
    setMappingForChannel(unnamed_0?: number, unnamed_1?: number): boolean;
  }
  
  /**
  * Provide telemetry around application launch metrics
  */
  declare class AppLaunchMetrics {
    getProcessUpTime(): number;
  }
  
  /**
  * Event will be triggered when an AME render job hasn't been created successfully or failed.
  */
  declare class CreateRemoteAMERenderJobEvent {
  }
  
  /**
  * An event to inform of encode progress and completion.
  */
  declare class EncoderWrapperEvent {
    readonly onAudioPreEncodeProgress: string;
    readonly onEncodeFinished: string;
    readonly onEncodeProgress: string;
    readonly audioInfo: string;
    readonly audioProgress: string;
    readonly result: string;
    addEventListener(): any;
    removeEventListener(): any;
    dispatchEvent(): any;
  }
  
  /**
  * Queue item object to set encode properties
  */
  declare class EncoderWrapper {
    readonly outputFiles: Array<any>;
    readonly outputHeight: number;
    readonly outputWidth: number;
    SetIncludeSourceXMP(includeSourceXMP: boolean): boolean;
    getEncodeProgress(): number;
    getEncodeTime(): number;
    getLogOutput(): string;
    getMissingAssets(includeSource: any, includeOutput: boolean): Array<any>;
    getPresetList(): Array<any>;
    loadFormat(format: any): boolean;
    loadPreset(presetPath: string): boolean;
    setCropOffsets(left: number, top: number, right: number, bottom: number): boolean;
    setCropState(cropState: boolean): boolean;
    setCropType(cropType: any, arg2: any, arg3: any, arg4: any, arg5: any, arg6: any, StretchToFillBeforeCrop: number): boolean;
    setCuePointData(inCuePointsFilePath: string): boolean;
    setFrameRate(framerate: any): boolean;
    setIncludeSourceCuePoints(includeSourceCuePoints: boolean): boolean;
    setOutputFrameSize(width: number, height: number): boolean;
    setRotation(rotationValue: any): boolean;
    setScaleType(scaleType: any, arg2: any, arg3: any, arg4: any, arg5: any, arg6: any, StretchToFillBeforeCrop: number): boolean;
    setTimeInterpolationType(interpolationType: any, arg2: any, OpticalFlow: number): boolean;
    setUseFrameBlending(useFrameBlending: boolean): boolean;
    setUseMaximumRenderQuality(useMaximumRenderQuality: boolean): boolean;
    setUsePreviewFiles(usePreviewFiles: boolean): boolean;
    setWorkArea(workAreaType: any, arg2: any, arg3: any, arg4: any, UseDefault: number, startTime: number, endTime: number): boolean;
    setWorkAreaInTicks(workAreaType: any, arg2: any, arg3: any, arg4: any, UseDefault: number, startTime: string, endTime: string): boolean;
    setXMPData(templateXMPFilePath: string): boolean;
  }
  
  /**
  * EncoderPreset class
  */
  declare class EncoderPreset {
    readonly id: string;
    readonly matchName: string;
    readonly name: string;
    setExportParamValue(paramString: string, presetParamValue: string): boolean;
    writeToFile(filePath: string): boolean;
  }
  
  /**
  * Provides the following event types for items in the batch queue: onItemEncodingStarted, onAudioPreEncodeProgress, onEncodingItemProgressUpdate, onItemEncodeComplete.For multiple batch items in the queue we recommend to use this event to ensure that the event types will be received for all batch items.It provides the following event type for the whole batch queue: onBatchEncoderStatusChanged.
  */
  declare class EncoderHostWrapperEvent {
    readonly onAudioPreEncodeProgress: string;
    readonly onBatchEncoderStatusChanged: string;
    readonly onEncodingItemProgressUpdate: string;
    readonly onItemEncodeComplete: string;
    readonly onItemEncodingStarted: string;
    readonly audioInfo: string;
    readonly audioProgress: number;
    readonly batchEncoderStatus: any;
    readonly outputFilePath: string;
    readonly progress: number;
    readonly result: string;
    readonly sourceFilePath: string;
    addEventListener(): any;
    removeEventListener(): any;
    dispatchEvent(): any;
  }
  
  /**
  * Provides several utility methods including batch commands to run, pause or stop the batch.
  */
  declare class EncoderHostScriptObject {
    createEncoderForFormat(inFormatName: string): Object;
    getBatchEncoderStatus(arg1: string): any;
    getCurrentBatchPreview(inOutputPath: any): boolean;
    getFormatList(): Array<any>;
    getSourceInfo(sourcePath: any): SourceMediaInfo;
    getSupportedImportFileTypes(): Array<any>;
    isBatchRunning(): boolean;
    pauseBatch(arg1: boolean): any;
    runBatch(arg1: boolean): any;
    stopBatch(arg1: boolean): any;
  }
  
  /**
  * EncoderEventObject class
  */
  declare class EncoderEventObject {
    readonly errorString: string;
    readonly jobID: string;
    readonly launchSuccess: boolean;
    readonly outputFile: string;
    readonly progress: number;
  }
  
  /**
  * Event will be triggered when encoding has been finished.
  */
  declare class EncodeFinishedEvent {
    readonly path: string;
  }
  
  /**
  * Event will be triggered when encoding has been finished.
  */
  declare class EncodeErrorEvent {
  }
  
  /**
  * Event will be triggered when encoding has been canceled.
  */
  declare class EncodeCancelledEvent {
  }
  
  /**
  * Event will be triggered when there is a change in any job owned by the logged-in User.
  */
  declare class CloudDispatcherJobChangeEvent {
    readonly jobEstimatedCompletion: string;
    readonly jobID: string;
    readonly jobName: string;
    readonly jobProgress: number;
    readonly jobState: string;
  }
  
  /**
  * Event will be triggered when there is a login completion
  */
  declare class CloudDispatcherObjectLoginEvent {
    readonly region: string;
  }
  
  /**
  * Event will be triggered after cloud queue list object has been loaded successfully or failed
  */
  declare class CloudQueueListObjectLoadEvent {
  }
  
  /**
  * Event will be triggered after cloud queue object has been loaded successfully or failed.
  */
  declare class CloudQueueObjectLoadEvent {
  }
  
  /**
  * A filter (audio/video) of a project
  */
  declare class FilterModule {
    readonly mediaType: Object;
    readonly displayName: string;
    readonly matchName: string;
  }
  
  /**
  * Color class
  */
  declare class ColorObject {
    alpha: number;
    blue: number;
    green: number;
    red: number;
    ColorObject(Red: number, Green: number, Blue: number, Alpha: number): ColorObject;
  }
  
  /**
  * ColorSpaceObject exposes various helpful scripting functions which are useful when working with color spaces
  */
  declare class ColorSpace {
    readonly empty: boolean;
    readonly isSceneReferred: boolean;
    readonly matrixEquation: number;
    readonly name: string;
    readonly primaries: number;
    readonly transferCharacteristic: number;
  }
  
  /**
  * FrameRate class
  */
  declare class FrameRate {
    ticksPerFrame: number;
    readonly value: number;
    FrameRate(): FrameRate;
    createWithValue(unnamed_0?: number): FrameRate;
  }
  
  /**
  * The Console object provides access to the DVA console.
  */
  declare class Console {
    execute(command: string): string;
    print(text: string, lf: boolean): boolean;
  }
  
  /**
  * Scripting interfaces to Media Browser. Can be used to make and/or cancel thumbnail and project item requests.
  */
  declare class MediaBrowser {
    cancelProjectItemRequests(): number;
    cancelThumbnailRequests(): number;
  }
  
  /**
  * This provides the utility to dub the given audio
  */
  declare class AutoDub {
    AutoDub(): AutoDub;
    createAutoDubJob(masterClip: Object, clipChannelGroupIndex: number): boolean;
  }
  
  /**
  * Event will be triggered when file transfer has been completed.
  */
  declare class CopyToSharedStorageCompleteEventObject {
    readonly errorCode: number;
    readonly errorMessage: string;
    readonly mediaFilePath: string;
    readonly mediaLocatorID: string;
    readonly productionID: string;
    readonly targetPath: string;
    readonly transferStatus: string;
  }
  
  /**
  * The ObjectReflection object provides information about the behavior of an object.
  */
  declare class ObjectReflection {
    readonly classProperties: Array<any>;
    readonly description: string;
    readonly eventObject: boolean;
    readonly eventTarget: boolean;
    readonly instanceProperties: Array<any>;
    readonly name: string;
    ObjectReflection(objectToInspect: Object): ObjectReflection;
    getObjectReflections(namespaces: Object): Array<any>;
    getThirdPartyObjectReflections(namespaces: Object): Array<any>;
  }
  
  /**
  * FootageInterpretation class
  */
  declare class FootageInterpretation {
    readonly ALPHACHANNELIGNORE: number;
    readonly ALPHACHANNELNONE: number;
    readonly ALPHACHANNELPREMULTIPLIED: number;
    readonly ALPHACHANNELSTRAIGHT: number;
    readonly FIELDTYPEDEFAULT: number;
    readonly FIELDTYPELOWERFIRST: number;
    readonly FIELDTYPEPROGRESSIVE: number;
    readonly FIELDTYPEUPPERFIRST: number;
    alphaUsage: number;
    colorSpace: ColorSpace;
    fieldType: number;
    frameRate: number;
    ignoreAlpha: boolean;
    inputLUTID: string;
    invertAlpha: boolean;
    pixelAspectRatio: number;
    removePulldown: boolean;
    vrConformProjectionType: number;
    vrHorizontalView: number;
    vrLayoutType: number;
    vrVerticalView: number;
    setInputLUTFromFilePath(unnamed_0?: string): string;
  }
  
  /**
  * Supports installing and importing Motion Graphics Templates
  */
  declare class EssentialGraphicsUtils {
    aeMogrtWorkflowChecks(sourcePath: string): Array<any>;
    installMOGRT(sourcePath: string, subFolderPath: string): string;
    isAEMogrt(sourcePath: string): Array<any>;
  }
  
  /**
  * Algebra BLAS data class
  */
  declare class Matrix {
    readonly cols: number;
    readonly rows: number;
    at(RowIdx: number, ColIdx: number): number;
    norm(): number;
  }
  
  /**
  * The ParameterReflection object provides information about the behavior of parameters of methods or constructors.
  */
  declare class ParameterReflection {
    readonly dataType: Object;
    readonly description: any;
    readonly name: string;
  }
  
  /**
  * AudioEffect class
  */
  declare class QEAudioEffect {
    readonly channelType: number;
    readonly name: string;
  }
  
  /**
  * AudioTransition class
  */
  declare class QEAudioTransition {
    readonly name: string;
  }
  
  /**
  * CloudDispatcher class
  */
  declare class QECloudDispatcher {
    createQueue(queueName: string, queueOwnerName: string): Object;
    getActiveRegion(): string;
    getAuthToken(): Object;
    getQueueListObject(): Object;
    getSupportedRegionList(): Array<any>;
    logIntoTaskQueueManager(): boolean;
    loginByRegion(region: string): boolean;
    setDiscoveryURL(discoveryURL: string): boolean;
  }
  
  /**
  * CloudQueue class
  */
  declare class QECloudQueue {
    readonly identifier: string;
    readonly name: string;
    createRemoteAMERenderJob(JobName: string, BinaryProjectSnapshotPath: string, BinaryExportPresetPath: string, OutputFilePath: string): Object;
    createRemoteAMERenderProjectJob(JobName: string, ProjectPath: string, ItemGUID: string, BinaryExportPresetPath: string, OutputFilePath: string): Object;
    loadAsync(): boolean;
    loadSync(): string;
    prepareRemoteAMERenderJob(JobName: string, BinaryProjectSnapshotPath: string, BinaryExportPresetPath: string, OutputFilePath: string): Object;
    prepareRemoteAMERenderProjectJob(JobName: string, ProjectPath: string, ItemGUID: string, BinaryExportPresetPath: string, OutputFilePath: string): Object;
  }
  
  /**
  * CloudQueueList class
  */
  declare class QECloudQueueList {
    getQueueByID(unnamed_0?: string): Object;
    getQueues(): Array<any>;
    loadAsync(): boolean;
    loadSync(): boolean;
  }
  
  /**
  * QEApp class
  */
  declare class QEApplication {
    readonly audioChannelMapping: number;
    readonly codeProfiler: Object;
    readonly config: string;
    readonly ea: QEEA;
    readonly language: string;
    readonly location: string;
    readonly name: string;
    readonly platform: string;
    readonly project: QEProject;
    readonly source: QESourceMonitor;
    readonly tqm: QECloudDispatcher;
    readonly version: string;
    beginDroppedFrameLogging(p0: string): boolean;
    disablePerformanceLogging(): boolean;
    enablePerformanceLogging(): boolean;
    enablePlayStats(): boolean;
    endDroppedFrameLogging(): boolean;
    executeConsoleCommand(p0: string): boolean;
    exit(): boolean;
    getDebugDatabaseEntry(p0: string): string;
    getDroppedFrames(): string;
    getModalWindowID(): string;
    getProgressContainerJSON(): string;
    getSequencePresets(): Array<any>;
    isFeatureEnabled(p0: string): boolean;
    isPerformanceLoggingEnabled(): boolean;
    localize(p0: string): string;
    newProject(p0: string): boolean;
    open(p0: string, unnamed_1?: boolean): boolean;
    outputToConsole(p0: string, unnamed_1?: boolean): boolean;
    resetProject(): boolean;
    setAudioChannelMapping(p0: number): boolean;
    setDebugDatabaseEntry(p0: string, p1: string): boolean;
    startPlayback(): boolean;
    stop(): boolean;
    stopPlayback(): boolean;
    wait(p0: number): boolean;
    write(p0: string, unnamed_1?: boolean): boolean;
  }
  
  /**
  * CreativeCloudIdentity class
  */
  declare class QECreativeCloudIdentity {
    readonly accessToken: string;
    readonly deviceIdentifier: string;
    readonly email: string;
    readonly personGUID: string;
  }
  
  /**
  * Component class
  */
  declare class QEComponent {
    readonly id: number;
    readonly matchName: string;
    readonly name: string;
    getParamControlValue(p0: string, unnamed_1?: string): string;
    getParamKeyframes(p0: string): Array<any>;
    getParamList(): Array<any>;
    getParamValue(p0: string, unnamed_1?: string): string;
    remove(): boolean;
    setParamValue(p0: string, p1: string, p2: string): boolean;
  }
  
  /**
  * Conflict class
  */
  declare class QEConflict {
    readonly availableResolveTypes: Array<any>;
    readonly id: string;
    readonly name: string;
    readonly type: string;
  }
  
  /**
  * Event will be triggered when project items have been added successfully to a project.
  */
  declare class ItemsAddedToProjectSuccessEventObject {
    readonly addedItems: Array<any>;
    readonly projectInfo: string;
  }
  
  /**
  * AuthToken class
  */
  declare class QEAuthToken {
    readonly token: string;
    readonly type: string;
  }
  
  /**
  * MediaLocatorObject class provides access to a medialocator.
  */
  declare class QEMediaLocatorObject {
    readonly identifier: string;
    getMediaLocatorPropertiesAsJSON(): string;
    setMediaLocatorProperties(unnamed_0?: string): boolean;
  }
  
  /**
  * MappedUnmappedMediaObject class
  */
  declare class QEMappedUnmappedMediaObject {
    readonly filePath: string;
    readonly isMapped: boolean;
    readonly volumeRelativePath: string;
    addNewMediaMapping(p0: string): boolean;
    copyToSharedStorage(p0: string): boolean;
    deleteMediaMapping(): boolean;
    shareMediaMapping(): boolean;
  }
  
  /**
  * Contains several encoding methods. You can listen to different types of the AMEExportEvent: onEncodeComplete, onError, onMediaInfoCreated, onBatchItemStatusChanged, onItemEncodingStarted, onEncodingItemProgressUpdated, onAudioPreEncodeProgress, onPostProcessListInitialized
  */
  declare class ExporterScriptObject {
    readonly elapsedMilliseconds: number;
    readonly encodeID: any;
    readonly encodeSuccess: any;
    exportGroup(sourcePath: any, outputPath: any, thenTheOutputFileLocationWillBeGeneratedBasedOnTheSo: string, presetsPath: any, matchSource: any): boolean;
    exportItem(sourcePath: any, outputPath: any, thenTheOutputFileLocationWillBeGeneratedBasedOnTheSo: string, presetPath: string, matchSource: any, writeFramesToDisk: any, arg7: any, arg8: any, and100OfTheFullDurationKnownIssue: any): EncoderWrapper;
    exportSequence(projectPath: any, outputPath: any, thenTheOutputFileLocationWillBeGeneratedBasedOnTheSo: string, presetPath: string, matchSource: any, writeFramesToDisk: any, arg7: any, arg8: any, and100OfTheFullDurationKnownIssue: any, leadingFramesToTrim: any, trailingFramesToTrim: any, sequenceName: any): boolean;
    getSourceMediaInfo(sourcePath: string): SourceMediaInfo;
    removeAllBatchItems(arg1: boolean): any;
    trimExportForSR(sourcePath: any, outputPath: any, thenTheOutputFileLocationWillBeGeneratedBasedOnTheSo: string, presetPath: string, matchSource: any, writeFramesToDisk: any, arg7: any, arg8: any, and100OfTheFullDurationKnownIssue: any, leadingFramesToTrim: any, trailingFramesToTrim: any): boolean;
  }
  
  /**
  * Exporter class
  */
  declare class Exporter {
    readonly classID: number;
    readonly fileExtension: string;
    readonly fileType: number;
    readonly name: string;
    getPresets(): Array<any>;
  }
  
  /**
  * The ExportSettings object provides the main access for export settings information and control.
  */
  declare class ExportSettings {
    readonly CONSTPOPUPSEPARATOR: string;
    readonly exportMenuManager: ExportMenuManager;
    readonly exportModeManager: ExportModeManager;
    readonly formatNameList: Array<any>;
    readonly fs: ExportFS;
    readonly presetManager: ExportPresetManager;
    presetFormatList(formatName: string): Array<any>;
  }
  
  /**
  * The ExportPresetManager object provides the main access for export settings information and control.
  */
  declare class ExportPresetManager {
    readonly favoritePresetList: Array<any>;
    readonly importPresets: Object;
    readonly isPresetManagerEnabled: boolean;
    readonly recentPresetList: Array<any>;
    readonly unsupportedFormatList: Array<any>;
    readonly unsupportedPresetNameList: Array<any>;
    readonly userPresetList: Object;
    deletePresets(presetIDs: Array<any>): Object;
    exportPresets(exportPresetsJSON: string): boolean;
    presetSummaryJSON(presetID: string, filePath: string): string;
    requestActivePresetChange(presetToBeSetAsActive: string): boolean;
    saveFavoritePresetsJSON(presetsJSON: string): boolean;
  }
  
  /**
  * The ExportPreset object provides the main access for export settings information in a export preset.
  */
  declare class ExportPreset {
    readonly displayName: string;
    readonly filePath: string;
    readonly folderDisplayPath: string;
    readonly isIngestPreset: boolean;
    readonly matchName: string;
    readonly presetSummaryJSON: string;
    readonly uniqueID: string;
    readonly userComments: string;
    comments(resolveZString: boolean): string;
  }
  
  /**
  * The ExportModeManager object provides the main access for full export settings information and control.
  */
  declare class ExportModeManager {
    readonly RENDERMODETYPECLOUD: number;
    readonly RENDERMODETYPELOCAL: number;
    readonly cropAspectRatioSelected: string;
    readonly cropAspectRatiosList: string;
    readonly cropBoundariesList: string;
    readonly cropCenter: string;
    readonly destinationCategoriesCollapsedList: string;
    readonly destinationCategoriesList: string;
    readonly destinations: string;
    readonly isExportModeRunning: boolean;
    readonly selectedDestinationIndex: number;
    readonly sourceSelections: string;
    readonly transcoder: Transcoder;
    addDestination(destID: string, destName: string): boolean;
    applyCropAspectRatio(inCropAspectRatioOptionStr: string): boolean;
    applyCropBoundary(inDirection: number, inPixelsToCrop: number): boolean;
    applyCropCenterX(inCenterX: number): boolean;
    applyCropCenterY(inCenterY: number): boolean;
    deleteDestination(destID: string, groupIndex: number): boolean;
    disableAndResetCrop(): boolean;
    getRenderModeType(): number;
    processExportModeAction(exportModeAction: number, inSdmContextGuid: string): boolean;
    renameDestination(destID: string, groupIndex: number, destDisplayName: string): boolean;
    restoreDefaultDestinations(): boolean;
    selectDestination(destID: string, groupIndex: number): boolean;
    setRenderModeType(renderModeType: number): boolean;
    shouldExportDestination(destID: string, groupIndex: number, shouldExport: boolean): boolean;
    toggleDestinationCategory(inDestinationCategory: string): boolean;
  }
  
  /**
  * The ExportMenuManager object provides the main access for export menu (quick export) settings information and control.
  */
  declare class ExportMenuManager {
    readonly isExportMenuRunning: boolean;
    readonly isMatchSequenceFeatureEnabled: boolean;
    readonly transcoder: Transcoder;
    processExportMenuAction(exportMenuAction: number, inSdmContextGuid: string): boolean;
  }
  
  /**
  * The Export Utilities object provides the main access for export utilities.
  */
  declare class ExportFS {
    readonly getLastExportFolder: string;
    readonly lastSelectedFolder: string;
    ensureFilepathUniqueness(filePath: string): string;
    parseFilePath(filePath: string): string;
    pathJoin(pathString1: string, pathString2: string): string;
    revealAndSelectFiles(filePaths: Array<any>): boolean;
    saveAsDialog(defaultDir: string, defaultFileName: string, extension: string): string;
    saveAsDialogWithFullPath(fullPathWithExtension: string): string;
    selectFolder(startFolder: string): string;
    setlastExportFolder(exportFolder: string): boolean;
    truncateString(filePath: string, truncationWidth: number, truncationType: string): string;
  }
  
  /**
  * MasterClip class
  */
  declare class QEMasterClip {
    readonly audioChannelType: number;
    readonly audioFrameRate: number;
    readonly audioNumChannels: number;
    readonly audioSampleSize: number;
    readonly duration: string;
    readonly filePath: string;
    readonly name: string;
    readonly videoFieldType: number;
    readonly videoFrameHeight: number;
    readonly videoFrameRate: number;
    readonly videoFrameWidth: number;
    readonly videoHasAlpha: boolean;
    readonly videoPixelAspectRatio: string;
    clearChildClips(): boolean;
    clearInPoint(): boolean;
    clearOutPoint(): boolean;
    hasChildClipsInUse(): boolean;
    numOfChildClips(): number;
    numOfChildClipsInUse(): number;
    setAudioInPoint(p0: string): boolean;
    setAudioOutPoint(p0: string): boolean;
    setDuration(p0: string): boolean;
    setInPoint(p0: string): boolean;
    setOutPoint(p0: string): boolean;
    setVideoInPoint(p0: string): boolean;
    setVideoOutPoint(p0: string): boolean;
  }
  
  /**
  * RectFloatObject class provides scripting access to dvacore Rect.
  */
  declare class RectF {
    bottom: number;
    height: number;
    left: number;
    right: number;
    size: any;
    top: number;
    width: number;
    RectF(inLeft: number, inTop: number, inWidth: number, inHeight: number): RectF;
    center(): any;
    distanceTo(inPoint: Object): any;
  }
  
  /**
  * Return the registered directories, expose new folder types as needed.
  */
  declare class RegisteredDirectoriesPPro {
  }
  
  /**
  * Player class
  */
  declare class QEPlayer {
    readonly audioClockJitters: number;
    readonly audioDeviceLoadAvg: number;
    readonly audioDeviceLoadMax: number;
    readonly audioDeviceLoadMin: number;
    readonly audioDeviceLoadStdDev: number;
    readonly audioDropouts: number;
    readonly audioIODropouts: number;
    readonly audioIOOverloads: number;
    readonly audioMediaNotFound: number;
    readonly audioPrefetchBehinds: number;
    readonly avgFPS: string;
    readonly avgPrefetchTime: string;
    readonly avgRenderRate: string;
    readonly droppedFrames: string;
    readonly isPlaying: boolean;
    readonly loopPlayback: boolean;
    readonly preroll: string;
    readonly totalFrames: string;
    captureAudioDeviceLoad(): boolean;
    clearAudioDropoutStatus(): boolean;
    disableStatistics(unnamed_0?: boolean): boolean;
    enableStatistics(unnamed_0?: boolean): boolean;
    endScrubbing(): boolean;
    getPosition(): string;
    play(playbackSpeed: number): boolean;
    scrubTo(p0: string): boolean;
    setLoopPlayback(loopingEnabled: boolean): boolean;
    startScrubbing(): boolean;
    step(deltaTimecode: string): boolean;
    stop(): boolean;
  }
  
  /**
  * Event will be triggered when media is missing.
  */
  declare class MissingMediaFoundEventObject {
    readonly productionID: string;
  }
  
  /**
  * TeamProjectsAdmin class
  */
  declare class QETeamProjectsAdmin {
    getArchivedProductions(): Array<any>;
    getProductions(): Array<any>;
    loadORGProductions(): boolean;
  }
  
  /**
  * HTTPResponse class
  */
  declare class QEHTTPResponse {
    getBody(): string;
    getError(): string;
    getHeaderKeys(): Array<any>;
    getHeaderValue(p0: string): string;
    getStatusCode(): number;
  }
  
  /**
  * RemoteAMERenderJob class
  */
  declare class QERemoteAMERenderJob {
    readonly created: string;
    readonly estimatedCompletion: string;
    readonly identifier: string;
    readonly isCompleted: boolean;
    readonly isError: boolean;
    readonly lastModified: string;
    readonly lockId: string;
    readonly name: string;
    readonly progress: number;
    readonly progressState: string;
    readonly state: string;
    readonly type: string;
    addInput(name: string, pathToInput: string): boolean;
    cancel(): boolean;
    loadAsync(): boolean;
    loadSync(): string;
    start(): boolean;
  }
  
  /**
  * RemoteAssetObject class
  */
  declare class QERemoteAssetObject {
    readonly additionalMediaLocatorIDs: Array<any>;
    readonly name: string;
    readonly primaryMediaLocatorID: string;
    readonly type: string;
    getAdditionalMediaLocators(): Array<any>;
    getPrimaryMediaLocator(): Object;
    import(): boolean;
  }
  
  /**
  * RemoteProduction class
  */
  declare class QERemoteProduction {
    readonly archiveURL: string;
    readonly deleteArchivedURL: string;
    readonly description: string;
    readonly identifier: string;
    readonly isOwnedByMe: boolean;
    readonly lastModified: string;
    readonly name: string;
    readonly restoreURL: string;
    readonly tags: string;
    readonly type: string;
    readonly url: string;
    archiveProduction(): boolean;
    deleteArchivedProduction(): boolean;
    getBatons(): Object;
    getCollaborators(): Array<any>;
    getHistory(): Object;
    getMediaLocator(MediaLocatorId: string): Object;
    getMediaMappings(): Object;
    getRemoteProductionID(): string;
    getSessionAssetList(): Array<any>;
    inviteUser(unnamed_0?: string): boolean;
    restoreProduction(): boolean;
    setTags(unnamed_0?: string): boolean;
    waitUntilAllProjectItemsAreLoaded(): boolean;
  }
  
  /**
  * RemoteProductionCollaborator class
  */
  declare class QERemoteProductionCollaborator {
    readonly email: string;
    isPresent(): boolean;
    remove(): boolean;
  }
  
  /**
  * RemoteProductionInvite class
  */
  declare class QERemoteProductionInvite {
    readonly productionName: string;
    readonly senderName: string;
    accept(): boolean;
    reject(): boolean;
  }
  
  /**
  * ResolveType class
  */
  declare class QEResolveType {
    readonly name: string;
  }
  
  /**
  * Sequence class
  */
  declare class QESequence {
    readonly CTI: QETime;
    readonly audioDisplayFormat: number;
    readonly audioFrameRate: number;
    readonly editingMode: string;
    readonly fieldType: number;
    readonly guid: string;
    readonly inPoint: Object;
    readonly multicam: Object;
    readonly name: string;
    readonly numAudioTracks: number;
    readonly numVideoTracks: number;
    readonly outPoint: Object;
    readonly par: number;
    readonly player: Object;
    readonly presetList: Array<any>;
    readonly previewPresetCodec: number;
    readonly previewPresetPath: string;
    readonly useMaxBitDepth: boolean;
    readonly useMaxRenderQuality: boolean;
    readonly videoDisplayFormat: number;
    readonly videoFrameRate: number;
    readonly workInPoint: Object;
    readonly workOutPoint: Object;
    addTracks(unnamed_0?: number, unnamed_1?: number, unnamed_2?: number, unnamed_3?: number, unnamed_4?: number, unnamed_5?: number, unnamed_6?: number, unnamed_7?: number): boolean;
    close(): boolean;
    deletePreviewFiles(p0: string, p1: string): boolean;
    exportDirect(p0: string, p1: string, unnamed_2?: boolean): boolean;
    exportFrameBMP(p0: string, p1: string, unnamed_2?: string): boolean;
    exportFrameDPX(p0: string, p1: string, unnamed_2?: string): boolean;
    exportFrameGIF(p0: string, p1: string, unnamed_2?: string): boolean;
    exportFrameJPEG(p0: string, p1: string, unnamed_2?: string): boolean;
    exportFramePNG(p0: string, p1: string, unnamed_2?: string): boolean;
    exportFrameTIFF(p0: string, p1: string, unnamed_2?: string): boolean;
    exportFrameTarga(p0: string, p1: string, unnamed_2?: string): boolean;
    exportToAME(p0: string, p1: string, unnamed_2?: boolean): boolean;
    extract(unnamed_0?: string, unnamed_1?: string): boolean;
    flushCache(): boolean;
    getAudioTrackAt(p0: number): QETrack<QEAudioTransition>;
    getEmptyBarTimes(): Array<any>;
    getExportComplete(): boolean;
    getExportFileExtension(p0: string): string;
    getGreenBarTimes(): Array<any>;
    getRedBarTimes(): Array<any>;
    getVideoTrackAt(p0: number): QETrack<QEVideoTransition>;
    getYellowBarTimes(): Array<any>;
    isIncompleteBackgroundVideoEffects(): boolean;
    isOpen(): boolean;
    left(unnamed_0?: string, unnamed_1?: string): boolean;
    lockTracks(p0: string, unnamed_1?: boolean): boolean;
    makeCurrent(): boolean;
    muteTracks(p0: string, unnamed_1?: boolean): boolean;
    razor(p0: string, unnamed_1?: boolean, unnamed_2?: boolean): boolean;
    removeAudioTrack(p0: number): boolean;
    removeEmptyAudioTracks(): boolean;
    removeEmptyVideoTracks(): boolean;
    removeTracks(unnamed_0?: number, unnamed_1?: number, unnamed_2?: number, unnamed_3?: number, unnamed_4?: number, unnamed_5?: number): boolean;
    removeVideoTrack(p0: number): boolean;
    renderAll(): boolean;
    renderAudio(): boolean;
    renderPreview(): boolean;
    setAudioDisplayFormat(p0: number): boolean;
    setAudioFrameRate(p0: number): boolean;
    setCTI(p0: string): boolean;
    setInOutPoints(p0: string, p1: string, unnamed_2?: boolean): boolean;
    setInPoint(p0: string, unnamed_1?: boolean, unnamed_2?: boolean): boolean;
    setOutPoint(p0: string, unnamed_1?: boolean, unnamed_2?: boolean): boolean;
    setPreviewFrameSize(p0: number, p1: number): boolean;
    setPreviewPresetPath(p0: string): boolean;
    setUseMaxBitDepth(p0: boolean): boolean;
    setUseMaxRenderQuality(p0: boolean): boolean;
    setVideoDisplayFormat(p0: number): boolean;
    setVideoFrameSize(p0: number, p1: number): boolean;
    setWorkInOutPoints(p0: string, p1: string, unnamed_2?: boolean): boolean;
    setWorkInPoint(p0: string, unnamed_1?: boolean): boolean;
    setWorkOutPoint(p0: string, unnamed_1?: boolean): boolean;
    syncLockTracks(p0: string, unnamed_1?: boolean): boolean;
  }
  
  /**
  * Multicam class
  */
  declare class QEMulticam {
    changeCamera(p0: number): boolean;
    enable(): boolean;
    play(): boolean;
    record(): boolean;
    stop(): boolean;
  }
  
  /**
  * VideoTransition class
  */
  declare class QEVideoTransition {
    readonly name: string;
  }
  
  /**
  * VideoEffect class
  */
  declare class QEVideoEffect {
    readonly name?: string;
  }
  
  /**
  * Time class
  */
  declare class QETime {
    readonly frames: number;
    readonly secs: number;
    readonly ticks: string;
    readonly timecode: string;
    QETime(): QETime;
  }
  
  /**
  * ProductionBatons class
  */
  declare class QEProductionBatons {
    acquireBaton(p0: Object): boolean;
    batonIsHeldForSequence(p0: Object): boolean;
    batonIsHeldForSequenceByCurrentUser(p0: Object): boolean;
    releaseBaton(p0: Object): boolean;
  }
  
  /**
  * ProductionHistory class
  */
  declare class QEProductionHistory {
    readonly length: number;
    getNextVersions(): Object;
    getVersionAt(unnamed_0?: number): Object;
  }
  
  /**
  * ProductionMediaMappingObject class
  */
  declare class QEProductionMediaMappingObject {
    readonly containsMappedFiles: boolean;
    readonly containsUnmappedFiles: boolean;
    readonly getAllMappedFiles: Array<any>;
    readonly getAllUnmappedFiles: Array<any>;
  }
  
  /**
  * ProductionVersion class
  */
  declare class QEProductionVersion {
    readonly productionURL: string;
    readonly revision: string;
    readonly timestamp: string;
    readonly title: string;
    readonly userID: string;
    readonly username: string;
    getProduction(): Object;
  }
  
  /**
  * ProfileDataLog class
  */
  declare class QEProfileDataLog {
    readonly averageTime: number;
    readonly id: string;
    readonly longestTime: number;
    readonly numLogs: number;
    readonly shortestTime: number;
    readonly totalTime: number;
    clear(): boolean;
  }
  
  /**
  * Project class
  */
  declare class QEProject {
    readonly currentRendererName: string;
    readonly importFailures: Array<any>;
    readonly isAudioConforming: boolean;
    readonly isAudioPeakGenerating: boolean;
    readonly isIndexing: boolean;
    readonly name: string;
    readonly numActiveProgressItems: number;
    readonly numAudioPeakGeneratedFiles: number;
    readonly numBins: number;
    readonly numConformedFiles: number;
    readonly numIndexedFiles: number;
    readonly numItems: number;
    readonly numSequenceItems: number;
    readonly numSequences: number;
    readonly path: string;
    close(p0: boolean, p1: boolean): boolean;
    deletePreviewFiles(p0: string): boolean;
    findItemByID(p0: string): Object;
    flushCache(): boolean;
    getActiveSequence(): QESequence;
    getAudioEffectByName(p0: string, channelType: number, unnamed_2?: boolean): QEAudioEffect;
    getAudioEffectList(effectType: number, unnamed_1?: boolean): Array<QEAudioEffect>;
    getAudioTransitionByName(p0: string, unnamed_1?: boolean): QEAudioTransition;
    getAudioTransitionList(unnamed_0?: boolean): Array<QEAudioTransition>;
    getBinAt(p0: number): Object;
    getItemAt(p0: number): QEProjectItem;
    getRemainingMetadataCacheIndexCount(): number;
    getRendererNames(): Array<any>;
    getSequenceAt(p0: number): QESequence;
    getSequenceItemAt(p0: number): any;
    getVideoEffectByName(p0: string, unnamed_1?: boolean): QEVideoEffect;
    getVideoEffectList(effectType: number, unnamed_1?: boolean): Array<any>;
    getVideoTransitionByName(p0: string, unnamed_1?: boolean): Object;
    getVideoTransitionList(unnamed_0?: number, unnamed_1?: boolean): Array<any>;
    import(p0: Array<any>, isNumberedStills: boolean): boolean;
    importAEComps(unnamed_0?: string, unnamed_1?: Array<any>): boolean;
    importAllAEComps(unnamed_0?: string): boolean;
    importFiles(unnamed_0?: Array<any>, unnamed_1?: boolean, unnamed_2?: boolean): boolean;
    importPSD(p0: string): boolean;
    importProject(filePath: string, sequences: Array<any>): boolean;
    init(): boolean;
    newBarsAndTone(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number): boolean;
    newBin(p0: string): boolean;
    newBlackVideo(p0: number, p1: number, p2: number, p3: number, p4: number): boolean;
    newColorMatte(p0: number, p1: number, p2: number, p3: number, p4: number): boolean;
    newSequence(p0: string, p1: string): boolean;
    newSmartBin(p0: string, p1: string): boolean;
    newTransparentVideo(p0: number, p1: number, p2: number, p3: number, p4: number): boolean;
    newUniversalCountingLeader(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number): boolean;
    redo(): boolean;
    resetNumFilesCounter(): boolean;
    save(): boolean;
    saveAs(p0: string): boolean;
    setRenderer(p0: string): boolean;
    sizeOnDisk(): number;
    undo(): boolean;
    undoStackIndex(): number;
  }
  
  /**
  * ProjectItem class
  */
  declare class QEProjectItem {
    readonly clip: QEMasterClip;
    readonly filePath: string;
    readonly name: string;
    automateToSequence(p0: Object, p1: number, p2: number, p3: number, p4: number): boolean;
    containsSpeechTrack(): boolean;
    createProxy(p0: string, p1: string): boolean;
    getMetadataSize(): number;
    isAudioConforming(): boolean;
    isAudioPeakGenerating(): boolean;
    isIndexing(): boolean;
    isOffline(): boolean;
    isPending(): boolean;
    linkMedia(p0: string, p1: boolean): boolean;
    openInSource(): boolean;
    rename(assetName: string): boolean;
    setOffline(): boolean;
  }
  
  /**
  * ProjectItemContainer class
  */
  declare class QEProjectItemContainer {
    readonly name: string;
    readonly numBins: number;
    readonly numItems: number;
    readonly numSequenceItems: number;
    readonly numSequences: number;
    flushCache(): boolean;
    getBinAt(p0: number): Object;
    getItemAt(p0: number): QEProjectItem;
    getSequenceAt(p0: number): Object;
    getSequenceItemAt(p0: number): Object;
    newBin(p0: string): boolean;
  }
  
  /**
  * TrackItem class
  */
  declare class QETrackItem<TransitionType> {
    readonly alignment: number;
    readonly antiAliasQuality: number;
    readonly borderColor: string;
    readonly borderWidth: number;
    readonly duration: string;
    readonly end: QETime;
    readonly endPercent: number;
    readonly frameBlend: boolean;
    readonly mediaType: string;
    readonly multicamEnabled: boolean;
    readonly name: string;
    readonly numComponents: number;
    readonly reverse: boolean;
    readonly reversed: boolean;
    readonly scaleToFrameSize: boolean;
    readonly speed: number;
    readonly start: QETime;
    readonly startPercent: number;
    readonly staticClipGain: number;
    readonly switchSources: boolean;
    readonly timeInterpolationType: number;
    readonly type: string;
    addAudioEffect(p0: QEAudioEffect): boolean;
    addTransition(p0: TransitionType, unnamed_1?: boolean, unnamed_2?: string, unnamed_3?: string, unnamed_4?: number, unnamed_5?: boolean, unnamed_6?: boolean): boolean;
    addVideoEffect(p0: QEVideoEffect): boolean;
    canDoMulticam(): boolean;
    getClipPanComponent(): QEComponent;
    getComponentAt(p0: number): QEComponent;
    getProjectItem(): QEProjectItem;
    move(p0: string, unnamed_1?: boolean, unnamed_2?: boolean, unnamed_3?: boolean, unnamed_4?: boolean, unnamed_5?: boolean, unnamed_6?: boolean): boolean;
    moveToTrack(p0: number, p1: number, p2: string, unnamed_3?: boolean): boolean;
    remove(unnamed_0?: boolean, unnamed_1?: boolean): boolean;
    removeEffects(unnamed_0?: boolean, unnamed_1?: boolean, unnamed_2?: boolean, unnamed_3?: boolean, unnamed_4?: boolean): boolean;
    rippleDelete(): boolean;
    roll(p0: string, p1: boolean, p2: boolean): boolean;
    setAntiAliasQuality(p0: number): boolean;
    setBorderColor(p0: number, p1: number, p2: number): boolean;
    setBorderWidth(p0: number): boolean;
    setEndPercent(p0: number): boolean;
    setEndPosition(p0: number, p1: number): boolean;
    setFrameBlend(p0: boolean): boolean;
    setMulticam(p0: boolean): boolean;
    setName(p0: string): boolean;
    setReverse(p0: boolean): boolean;
    setScaleToFrameSize(p0: boolean): boolean;
    setSpeed(p0: number, p1: string, p2: boolean, p3: boolean, p4: boolean): boolean;
    setStartPercent(p0: number): boolean;
    setStartPosition(p0: number, p1: number): boolean;
    setSwitchSources(p0: boolean): boolean;
    setTimeInterpolationType(p0: number): boolean;
    slide(p0: string, unnamed_1?: boolean): boolean;
    slip(p0: string, unnamed_1?: boolean): boolean;
  }

  interface TrackItem {
    toQETrackItem<TransitionType>(): QETrackItem<TransitionType>;
  }
  
  /**
  * Track class
  */
  declare class QETrack<TransitionType> {
    readonly id: number;
    readonly index: number;
    readonly name: string;
    readonly numComponents: number;
    readonly numItems: number;
    readonly numTransitions: number;
    readonly type: string;
    addAudioEffect(p0: QEAudioEffect, unnamed_1?: number, unnamed_2?: boolean): boolean;
    getComponentAt(p0: number): any;
    getItemAt(p0: number): QETrackItem<TransitionType>;
    getTransitionAt(p0: number): TransitionType;
    insert(p0: Object, unnamed_1?: string, unnamed_2?: boolean, unnamed_3?: boolean, unnamed_4?: boolean, unnamed_5?: boolean): boolean;
    isLocked(): boolean;
    isMuted(): boolean;
    isSyncLocked(): boolean;
    overwrite(p0: Object, unnamed_1?: string, unnamed_2?: boolean, unnamed_3?: boolean, unnamed_4?: boolean, unnamed_5?: boolean): boolean;
    razor(p0: string, unnamed_1?: boolean, unnamed_2?: boolean): boolean;
    setLock(p0: boolean): boolean;
    setMute(p0: boolean): boolean;
    setName(p0: string): boolean;
    setSyncLock(p0: boolean): boolean;
  }
  
  /**
  * SourceMonitor class
  */
  declare class QESourceMonitor {
    readonly clip: Object;
    readonly player: Object;
    openFilePath(p0: string): boolean;
  }
  
  /**
  * TickTime class
  */
  declare class TickTime {
    readonly TIMEINVALID: Object;
    readonly TIMEMAX: Object;
    readonly TIMEMIN: Object;
    readonly TIMEONEHOUR: Object;
    readonly TIMEONEMINUTE: Object;
    readonly TIMEONESECOND: Object;
    readonly TIMEZERO: Object;
    readonly seconds: number;
    readonly ticks: string;
    readonly ticksNumber: number;
    TickTime(): TickTime;
    createWithFrameAndFrameRate(frameCount: number, frameRate: FrameRate): Object;
    createWithSeconds(seconds: number): Object;
    createWithTicks(ticks: string): Object;
    createWithTicksNumber(ticksNumber: number): Object;
    timeToTimecode(TickTime: Object, FrameRate: Object, TimeDisplay: Object): string;
    timecodeToTime(TimecodeString: string, FrameRate: Object, TimeDisplay: Object): TickTime;
    add(tickTime: TickTime): TickTime;
    alignToFrame(FrameRate: Object): TickTime;
    alignToNearestFrame(FrameRate: Object): TickTime;
    divide(divisor: number): TickTime;
    equals(TickTime: Object): boolean;
    multiply(factor: number): TickTime;
    subtract(tickTime: TickTime): TickTime;
    toFrame(frameRate: FrameRate): number;
  }
  
  /**
  * Results of a pixel-based comparison. Includes number of different pixels, percent variation, and an error message if necessary.
  */
  declare class PixelCompareTestResults {
    readonly diffData: string;
    readonly numDiffPixels: number;
    readonly result: number;
    readonly variance: number;
    PixelCompareTestResults(): PixelCompareTestResults;
  }
  
  /**
  * Performs pixel comparison between two video frames.
  */
  declare class PixelComparison {
    PixelComparison(): PixelComparison;
    pixelCompare(inImagePath: string, compareImagePath: string, epsilon: number): any;
    pixelCompareNonMaskRegion(inOriginalImagePath: string, inCompareImagePath: string, inMaskOnlyPath: string): any;
  }
  
  /**
  * TimeDisplay class
  */
  declare class TimeDisplay {
    customFPS: number;
    type: number;
    TimeDisplay(): TimeDisplay;
  }
  
  /**
  * Algebra BLAS data class
  */
  declare class Vector {
    readonly cols: number;
    readonly length: number;
    readonly rows: number;
    at(RowIdx: number, ColIdx: number): number;
    dot(other: Object): number;
    norm(): number;
  }
  
  /**
  * Event will be triggered when a sequence has been activated
  */
  declare class SequenceActivatedEventObject {
  }
  
  /**
  * PluginSupport has various utility helper functions useful for runtime diagnosis of issues reported to the user from the plugin layer.
  */
  declare class PluginSupport {
    eventDateTime(unnamed_0?: number): string;
    eventDescription(unnamed_0?: number): string;
    eventTitle(unnamed_0?: number): string;
    eventType(unnamed_0?: number): number;
    eventsCount(): number;
  }
  
  /**
  * Provides scripting env access to dvacore::geom::Point.
  */
  declare class PointF {
    x: number;
    y: number;
    PointF(inX: number, inY: number): PointF;
    distanceTo(inPoint: Object): number;
  }
  
  /**
  * The OSInfo object provides information about the operating system.
  */
  declare class OSInfo {
    readonly architecture: string;
    readonly emulation: boolean;
    readonly name: string;
  }
  
  /**
  * Preset manager event object
  */
  declare class PresetManagerEvent {
    readonly EVENTACTIVEPRESETCHANGEREQUESTED: string;
    readonly EVENTFAVORITEANDRECENTPRESETSUPDATED: string;
    readonly EVENTFAVORITEPRESETSUPDATED: string;
    readonly favoriteList: Array<any>;
    readonly presetToBeSetAsActive: string;
    readonly recentList: Array<any>;
    addEventListener(): any;
    removeEventListener(): any;
    dispatchEvent(): any;
  }
  
  /**
  * Event will be triggered to support setTimeout.
  */
  declare class TimeoutEventObject {
  }
  
  /**
  * Timeout class
  */
  declare class Timeout {
    Timeout(milliseconds: number): Timeout;
    addEventListener(): any;
    removeEventListener(): any;
    dispatchEvent(): any;
  }
  
  /**
  * SimplifySequenceParams is the collection of settings used to script SimplifySequence as a user would in the ui.
  */
  declare class SimplifySequenceParams {
    readonly LABELCOLOR0: number;
    readonly LABELCOLOR1: number;
    readonly LABELCOLOR10: number;
    readonly LABELCOLOR11: number;
    readonly LABELCOLOR12: number;
    readonly LABELCOLOR13: number;
    readonly LABELCOLOR14: number;
    readonly LABELCOLOR15: number;
    readonly LABELCOLOR2: number;
    readonly LABELCOLOR3: number;
    readonly LABELCOLOR4: number;
    readonly LABELCOLOR5: number;
    readonly LABELCOLOR6: number;
    readonly LABELCOLOR7: number;
    readonly LABELCOLOR8: number;
    readonly LABELCOLOR9: number;
    readonly MARKERCOLORBLUE: number;
    readonly MARKERCOLORCYAN: number;
    readonly MARKERCOLORGREEN: number;
    readonly MARKERCOLORMAGENTA: number;
    readonly MARKERCOLORORANGE: number;
    readonly MARKERCOLORRED: number;
    readonly MARKERCOLORWHITE: number;
    readonly MARKERCOLORYELLOW: number;
    readonly parameters: Object;
    applyToAudio: boolean;
    applyToVideo: boolean;
    closeVerticalGaps: boolean;
    flattenMulticam: boolean;
    removeClipsWithLabelColors: Array<any>;
    removeDiabledClips: boolean;
    removeDiabledTracks: boolean;
    removeEmptyTracks: boolean;
    removeGraphicClips: boolean;
    removeOfflineClips: boolean;
    removeSequenceMarkerColors: Array<any>;
    removeThroughEdits: boolean;
    removeTransitions: boolean;
    SimplifySequenceParams(): SimplifySequenceParams;
    simplifySequenceOnActiveSequence(newSimplifiedSequenceName: string): boolean;
  }
  
  /**
  * Event will be triggered when a project has changed.
  */
  declare class ProjectChangedEventObject {
    readonly projectID: string;
  }
  
  /**
  * Event will be triggered after drag&drop items in the project panel.
  */
  declare class ProjectEndDropEventObject {
  }
  
  /**
  * Event will be triggered when the project clip selection has been changed. The event contains a list of selected project items and the project view id.
  */
  declare class ProjectSourceClipSelectionEventObject {
    readonly projectViewID: string;
    readonly selectedItems: Array<any>;
  }
  
  /**
  * Interface to OS spellcheck operations
  */
  declare class Spellcheck {
    addWord(text: string, language: string): boolean;
    checkSpelling(text: string, language: string): Object;
    getCandidates(text: string, startEnd: Object, language: string): Array<any>;
    spellcheckSupported(): boolean;
  }
  
  /**
  * Algebra BLAS data class
  */
  declare class SparseVector {
    readonly cols: number;
    readonly length: number;
    readonly rows: number;
    at(RowIdx: number, ColIdx: number): number;
    dot(other: Object): number;
    norm(): number;
  }
  
  /**
  * Algebra BLAS data class
  */
  declare class SparseMatrix {
    readonly cols: number;
    readonly rows: number;
    at(RowIdx: number, ColIdx: number): number;
    norm(): number;
  }
  
  /**
  * ProgressCategory class
  */
  declare class ProgressCategory {
    readonly id: string;
    dumpJSON(): string;
    getProgressItemFromReferenceID(referenceGuid: Object): Object;
    getProgressItems(): Array<any>;
    getTitle(): string;
    getValue(): number;
    hasDoneJobs(): boolean;
    hasPendingJobs(): boolean;
    isIndeterminateProgress(): boolean;
    removeCancelledJobs(): boolean;
    removeDoneJobs(): boolean;
    removeProgressItem(inProgressItem: Object): boolean;
    showInHeaderBar(): boolean;
    showOnlyStatusColumn(): boolean;
  }
  
  /**
  * ProgressCategoryContainer class
  */
  declare class ProgressCategoryContainer {
    readonly EVENTPROGRESSCATEGORYADDED: string;
    readonly EVENTPROGRESSCATEGORYREMOVED: string;
    readonly EVENTPROGRESSITEMADDED: string;
    readonly EVENTPROGRESSITEMREMOVED: string;
    getContainer(): Object;
    addEventListener(): any;
    removeEventListener(): any;
    dispatchEvent(): any;
    getAllProgressCategories(): Array<any>;
    getOrCreateProgressCategory(inCategoryID: string, inTitle: string): Object;
    getProgressItemFromReferenceID(referenceGuid: Object): Object;
    hasDoneJobs(): boolean;
    pauseAllProgressItems(): boolean;
    removeDoneJobs(): boolean;
    removeProgressCategory(inProgressCategory: Object): boolean;
    resumeAllProgressItems(): boolean;
    subscribeToEvent(eventKey: string): boolean;
  }
  
  /**
  * Collection of Progress Item properties and methods to pause, resume and cancel progress items.
  */
  declare class ProgressItem {
    readonly EVENTPROGRESSITEMCANCELLED: string;
    readonly EVENTPROGRESSITEMTITLECHANGED: string;
    readonly EVENTPROGRESSITEMVALUECHANGED: string;
    readonly PROGRESSSTATECANCELLED: number;
    readonly PROGRESSSTATEFAILED: number;
    readonly PROGRESSSTATENORMAL: number;
    readonly PROGRESSSTATEPAUSED: number;
    readonly PROGRESSSTATERESUMED: number;
    readonly PROGRESSSTATEWAITING: number;
    readonly creationTime: any;
    readonly referenceId: Object;
    addEventListener(): any;
    removeEventListener(): any;
    dispatchEvent(): any;
    cancelProgress(): boolean;
    getMaxValue(): number;
    getProgressState(): number;
    getStatusMessage(): string;
    getTitle(): string;
    getValue(): number;
    isComplete(): boolean;
    isInProgress(): boolean;
    isIndeterminateProgress(): boolean;
    isPending(): boolean;
    pauseOrResumeProgress(inProgresState: number): boolean;
    subscribeToEvent(eventKey: string): boolean;
    supportsCancellation(): boolean;
    supportsPauseAndResume(): boolean;
  }
  
  /**
  * Properties class
  */
  declare class Properties {
    clearProperty(unnamed_0?: string): boolean;
    doesPropertyExist(unnamed_0?: string): boolean;
    getProperty(unnamed_0?: string): string;
    isPropertyReadOnly(unnamed_0?: string): boolean;
    setProperty(): boolean;
  }
  
  /**
  * The PropertyReflection object provides information about the behavior of an property.
  */
  declare class PropertyReflection {
    readonly async: boolean;
    readonly dataType: Object;
    readonly description: string;
    readonly name: string;
    readonly parameters: Array<any>;
    readonly type: any;
  }
  
  /**
  * Transcoder event object
  */
  declare class TranscoderEvent {
    readonly EVENTDESTINATIONSELECTED: string;
    readonly EVENTDISKSPACEREQUIREMENTCHANGED: string;
    readonly EVENTEXPORTWORKAREACHANGED: string;
    readonly EVENTFORMATCHANGED: string;
    readonly EVENTNEWEVENTGENERATED: string;
    readonly EVENTOUTPUTFILENAMECHANGED: string;
    readonly EVENTSELECTNEWPRESET: string;
    readonly EVENTSHOWEXPORTWARNING: string;
    readonly EVENTUPDATEALLSETTINGS: string;
    readonly EVENTUPDATEDEPENDENCIES: string;
    readonly eventInfo: string;
    addEventListener(): any;
    removeEventListener(): any;
    dispatchEvent(): any;
  }
  
  /**
  * The Transcoder object provides the main access for full export settings information and control.
  */
  declare class Transcoder {
    readonly currentDestination: string;
    readonly currentDestinationIsLoggedIn: boolean;
    readonly currentPresetSettingsGroups: string;
    readonly currentSourceMasterClips: Array<any>;
    readonly currentSourceSequence: Sequence;
    readonly destinations: string;
    readonly estimatedFileSize: string;
    readonly exportDestinationsDirect: boolean;
    readonly exportDirect: boolean;
    readonly getJSONConvertOptionIncludeHiddenParams: boolean;
    readonly getJSONConvertOptionIncludeUnsetValues: boolean;
    readonly importIntoProject: boolean;
    readonly isMatchSequenceSettingsAllowed: boolean;
    readonly isOutputFilePathLocked: boolean;
    readonly matchSequenceSettings: boolean;
    readonly originPresetHasEnabledPublishGroups: boolean;
    readonly outputFilePath: string;
    readonly presetActionsGroupSettings: string;
    readonly presetAudioGroupSettings: string;
    readonly presetCaptionGroupSettings: string;
    readonly presetEffectsGroupSettings: string;
    readonly presetIngestGroupSettings: string;
    readonly presetMetadataGroupSettings: string;
    readonly presetPublishGroupSettings: string;
    readonly presetVideoGroupSettings: string;
    readonly rangeOption: any;
    readonly scalingOption: any;
    readonly sourceSelection: string;
    changeFormat(newFormat: string): boolean;
    changeMatchSource(id: string, value: boolean): boolean;
    changeParameter(group: string, id: string, value: string): boolean;
    currentPresetInfo(includeSettings: boolean): string;
    currentPresetSettingsForGroup(groupKey: string): string;
    exportCurrentPresetTo(filePath: string, presetComments: string): boolean;
    getAspectRatioLock(): boolean;
    hasContentCredentials(): Object;
    saveAsDialog(defaultDir: string, defaultFileName: string, extension: string): string;
    saveAsDialogWithFullPath(fullPathWithExtension: string): string;
    saveCustomPreset(presetName: string, saveEffectSettings: boolean, savePublishSettings: boolean): boolean;
    selectDestination(destID: string, groupIndex: number): boolean;
    setAspectRatioLock(value: boolean): boolean;
    setCurrentPreset(presetID: string): boolean;
    setDestinationCustomData(destID: string, groupIndex: number, customData: string): boolean;
    setImportIntoProject(importExportedFile: boolean): boolean;
    setJSONConvertOptions(includeHiddenParams: boolean, includeUnsetValues: boolean): boolean;
    setMatchSequenceSettings(matchSequenceSettings: boolean): boolean;
    setOutputFilePath(filePath: string, createUniqueFilename: boolean): boolean;
    setRangeOption(rangeOption: number): boolean;
    setScalingOption(scalingOption: number): boolean;
    validateOutputFilePathCollisions(filePath: string): number;
  }
  
  /**
  * Script object for stock wrangler search parameters.
  */
  declare class StockWranglerParameter {
    readonly params: Object;
    bpmMax: number;
    bpmMin: number;
  }
  
  /**
  * The stock wrangler object for testing stock audio.
  */
  declare class StockWrangler {
    readonly wrangler: Object;
    readonly numResults: number;
    initiateSFXSearch(params: StockWranglerParameter): boolean;
    initiateSearch(params: StockWranglerParameter): boolean;
  }
  
  /**
  * Get the width, height, PAR, duration, etc about the imported source
  */
  declare class SourceMediaInfo {
    readonly audioDuration: string;
    readonly description: string;
    readonly dropFrameTimeCode: boolean;
    readonly duration: string;
    readonly durationInTicks: string;
    readonly fieldType: string;
    readonly frameRate: string;
    readonly height: string;
    readonly importer: string;
    readonly numChannels: string;
    readonly parX: string;
    readonly parY: string;
    readonly sampleRate: string;
    readonly width: string;
    readonly xmp: string;
  }
  
  /**
  * Collection of useful functions, add to this as needed - defaults to private visibility.
  */
  declare class UtilityFunctionsPPro {
  }
  
  declare var qe: QEApplication;