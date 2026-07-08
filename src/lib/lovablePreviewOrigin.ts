import rootsHighlightAsset from "../assets/roots-highlight.mp4.asset.json";

/** Lovable id-preview host — serves uploaded /__l5e assets during local dev */
export function getLovablePreviewOrigin(projectId = rootsHighlightAsset.project_id) {
  return `https://id-preview--${projectId}.lovable.app`;
}
