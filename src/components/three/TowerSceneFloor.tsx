type TowerSceneFloorProps = {
  towerX: number;
  floorY: number;
  size: number;
};

/** No visible ground plane — shadows use mesh self-shadowing only */
export function TowerSceneFloor(_props: TowerSceneFloorProps) {
  return null;
}
