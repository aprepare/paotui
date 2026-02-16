import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase, createTestEnv, seedDoc } from '../mocks/wx-server-sdk.js'
import fc from 'fast-check'

const { main } = await import('../../cloudfunctions/forum/index.js')

function setup() {
  resetDatabase()
  seedDoc('users', 'u1', { openid: 'author', name: 'Author', avatar: '' })
  seedDoc('users', 'u2', { openid: 'reader', name: 'Reader', avatar: '' })
}

async function createPost(openid = 'author', content = '今天天气真好') {
  createTestEnv(openid)
  const res = await main({ action: 'create', data: { content } }, {})
  return res.id
}

// ─── 7.1 Unit tests ─────────────────────────────────────────────────

describe('forum cloud function - unit tests', () => {
  beforeEach(setup)

  it('create with valid content', async () => {
    const id = await createPost()
    expect(id).toBeTruthy()
  })

  it('create with empty content rejected', async () => {
    createTestEnv('author')
    const res = await main({ action: 'create', data: { content: '' } }, {})
    expect(res.code).toBe(-1)
  })

  it('like toggle behavior', async () => {
    const postId = await createPost()
    createTestEnv('reader')
    const r1 = await main({ action: 'like', data: { postId } }, {})
    expect(r1.code).toBe(0)
    expect(r1.liked).toBe(true)
    const r2 = await main({ action: 'like', data: { postId } }, {})
    expect(r2.liked).toBe(false)
  })

  it('comment with reply', async () => {
    const postId = await createPost()
    createTestEnv('reader')
    const c1 = await main({ action: 'comment', data: { postId, content: '好帖' } }, {})
    expect(c1.code).toBe(0)
    // Reply to the comment
    createTestEnv('author')
    const c2 = await main({
      action: 'comment',
      data: { postId, content: '谢谢', replyTo: c1.id, replyName: 'Reader' },
    }, {})
    expect(c2.code).toBe(0)
  })

  it('delete cascades to comments', async () => {
    const postId = await createPost()
    createTestEnv('reader')
    await main({ action: 'comment', data: { postId, content: '评论1' } }, {})
    await main({ action: 'comment', data: { postId, content: '评论2' } }, {})
    createTestEnv('author')
    const res = await main({ action: 'delete', data: { postId } }, {})
    expect(res.code).toBe(0)
    const cloud = createTestEnv('author')
    const db = cloud.database()
    const cmts = await db.collection('forum_comments').where({ postId }).count()
    expect(cmts.total).toBe(0)
  })

  it('deleteComment permission (author or post owner)', async () => {
    const postId = await createPost('author')
    createTestEnv('reader')
    const c = await main({ action: 'comment', data: { postId, content: '评论' } }, {})
    // Post owner can delete
    createTestEnv('author')
    const res = await main({ action: 'deleteComment', data: { commentId: c.id } }, {})
    expect(res.code).toBe(0)
  })

  it('non-owner cannot delete post', async () => {
    const postId = await createPost('author')
    createTestEnv('reader')
    const res = await main({ action: 'delete', data: { postId } }, {})
    expect(res.code).toBe(-1)
    expect(res.msg).toBe('仅发布者可删除')
  })
})


// ─── 7.2 Property 9: like toggle round-trip ─────────────────────────

describe('Feature: comprehensive-testing, Property 9: Forum like toggle round-trip', () => {
  // **Validates: Requirements 6.1, 6.2**
  it('for any post and user, liking twice restores original likes and likedBy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }),
        async (content) => {
          setup()
          const postId = await createPost('author', content)
          const cloud = createTestEnv('reader')
          const db = cloud.database()
          const before = await db.collection('forum_posts').doc(postId).get()
          const beforeLikes = before.data.likes
          const beforeLikedBy = JSON.parse(JSON.stringify(before.data.likedBy))

          await main({ action: 'like', data: { postId } }, {})
          await main({ action: 'like', data: { postId } }, {})

          const after = await db.collection('forum_posts').doc(postId).get()
          expect(after.data.likes).toBe(beforeLikes)
          expect(after.data.likedBy).toEqual(beforeLikedBy)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 7.3 Property 10: comment increments count ─────────────────────

describe('Feature: comprehensive-testing, Property 10: Forum comment increments count', () => {
  // **Validates: Requirements 6.4**
  it('for any post, after commenting, comments count equals actual comment records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (commentText) => {
          setup()
          const postId = await createPost()
          createTestEnv('reader')
          await main({ action: 'comment', data: { postId, content: commentText } }, {})

          const cloud = createTestEnv('reader')
          const db = cloud.database()
          const post = await db.collection('forum_posts').doc(postId).get()
          const cmts = await db.collection('forum_comments').where({ postId }).count()
          expect(post.data.comments).toBe(cmts.total)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 7.4 Property 11: post deletion cascades ───────────────────────

describe('Feature: comprehensive-testing, Property 11: Forum post deletion cascades to comments', () => {
  // **Validates: Requirements 6.6**
  it('for any post with comments, deleting removes all comments', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (numComments) => {
          setup()
          const postId = await createPost()
          for (let i = 0; i < numComments; i++) {
            createTestEnv('reader')
            await main({ action: 'comment', data: { postId, content: '评论' + i } }, {})
          }
          createTestEnv('author')
          await main({ action: 'delete', data: { postId } }, {})

          const cloud = createTestEnv('author')
          const db = cloud.database()
          const cmts = await db.collection('forum_comments').where({ postId }).count()
          expect(cmts.total).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 7.5 Property 12: non-owner deletion rejection ─────────────────

describe('Feature: comprehensive-testing, Property 12: Forum/Market non-owner deletion rejection', () => {
  // **Validates: Requirements 6.7, 12.5**
  it('for any post/goods, non-owner delete returns error', async () => {
    const marketMain = (await import('../../cloudfunctions/market/index.js')).main

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }).filter(s => s !== 'author'),
        async (strangerId) => {
          setup()
          seedDoc('users', 'u_s', { openid: strangerId, name: 'Stranger' })
          // Forum post
          const postId = await createPost('author')
          createTestEnv(strangerId)
          const r1 = await main({ action: 'delete', data: { postId } }, {})
          expect(r1.code).toBe(-1)

          // Market goods
          createTestEnv('author')
          const g = await marketMain({
            action: 'create',
            data: { title: '二手书', price: 10 },
          }, {})
          createTestEnv(strangerId)
          const r2 = await marketMain({ action: 'delete', data: { goodsId: g.id } }, {})
          expect(r2.code).toBe(-1)
        }
      ),
      { numRuns: 100 }
    )
  })
})
