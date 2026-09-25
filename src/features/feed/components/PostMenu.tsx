import { DotsThreeOutline, Prohibit, ShareNetwork, SmileySad, Trash, Warning } from '@phosphor-icons/react'
import { IconButton, Menu, MenuItem } from '@/components/ui'
import type { Post } from '../types'

export interface PostMenuActions {
  onShare: () => void
  onNotInterested: () => void
  onBlock: () => void
  onReport: () => void
  onDelete: () => void
}

/** "…" menu on a post — "posts BSheet" (others' posts) / "user post" (own posts) in Figma. */
export function PostMenu({ post, ...actions }: { post: Post } & PostMenuActions) {
  return (
    <Menu
      trigger={
        <IconButton label="Post options" className="size-7 text-fg-muted">
          <DotsThreeOutline weight="fill" className="size-7" />
        </IconButton>
      }
    >
      {(close) => {
        const run = (action: () => void) => () => {
          close()
          action()
        }
        return post.isMine ? (
          <>
            <MenuItem icon={<ShareNetwork />} onSelect={run(actions.onShare)}>
              Share
            </MenuItem>
            <MenuItem icon={<Trash />} tone="danger" onSelect={run(actions.onDelete)}>
              Delete Post
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem icon={<ShareNetwork />} onSelect={run(actions.onShare)}>
              Share
            </MenuItem>
            <MenuItem icon={<SmileySad />} onSelect={run(actions.onNotInterested)}>
              Not interested
            </MenuItem>
            <MenuItem icon={<Prohibit />} tone="warning" onSelect={run(actions.onBlock)}>
              Block {post.author.name}
            </MenuItem>
            <MenuItem icon={<Warning />} tone="danger" onSelect={run(actions.onReport)}>
              Report post
            </MenuItem>
          </>
        )
      }}
    </Menu>
  )
}
