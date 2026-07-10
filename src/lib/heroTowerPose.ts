/** Hero tower framing — load pose matches Janta Vision reference */
export const HERO_TOWER_POSE = {
  initialRotationY: 2.5,
  // Same view direction as the panel-forward pose, panned left (camera + target
  // together) so the tower sits a touch further right and stays fully in frame.
  cameraPosition: [0.65, 4.52, 10.45] as const,
  cameraTarget: [0.1, 1, 0] as const,
  cameraFov: 35,
} as const;
