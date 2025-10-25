(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-HASH u101)
(define-constant ERR-INVALID-TITLE u102)
(define-constant ERR-INVALID-DESCRIPTION u103)
(define-constant ERR-INVALID-CATEGORY u104)
(define-constant ERR-INVALID-TIMESTAMP u105)
(define-constant ERR-ACHIEVEMENT-ALREADY-EXISTS u106)
(define-constant ERR-ACHIEVEMENT-NOT-FOUND u107)
(define-constant ERR-INVALID-OWNER u108)
(define-constant ERR-INVALID-UPDATE u109)
(define-constant ERR-INVALID-DELETE u110)
(define-constant ERR-MAX-ACHIEVEMENTS-EXCEEDED u111)
(define-constant ERR-INVALID-VISIBILITY u112)
(define-constant ERR-INVALID-METADATA u113)
(define-constant ERR-INVALID-EXPIRY u114)
(define-constant ERR-INVALID-STATUS u115)
(define-constant ERR-INVALID-RATING u116)
(define-constant ERR-INVALID-COMMENT u117)
(define-constant ERR-INVALID-ATTACHMENT u118)
(define-constant ERR-INVALID-SCORE u119)
(define-constant ERR-INVALID-LEVEL u120)

(define-data-var next-achievement-id uint u0)
(define-data-var max-achievements-per-user uint u100)
(define-data-var storage-fee uint u500)
(define-data-var admin-principal principal tx-sender)

(define-map achievements
  { owner: principal, id: uint }
  {
    hash: (buff 32),
    title: (string-utf8 100),
    description: (string-utf8 500),
    category: (string-utf8 50),
    timestamp: uint,
    visibility: bool,
    metadata: (optional (string-utf8 200)),
    expiry: (optional uint),
    status: bool,
    rating: uint,
    comment: (optional (string-utf8 200)),
    attachment: (optional (buff 64)),
    score: uint,
    level: uint
  }
)

(define-map achievement-ids-by-owner
  principal
  (list 100 uint)
)

(define-map achievement-count-by-owner
  principal
  uint
)

(define-map achievement-updates
  { owner: principal, id: uint }
  {
    update-timestamp: uint,
    updater: principal,
    changes: (string-utf8 200)
  }
)

(define-read-only (get-achievement (owner principal) (id uint))
  (map-get? achievements { owner: owner, id: id })
)

(define-read-only (get-achievement-ids (owner principal))
  (default-to (list) (map-get? achievement-ids-by-owner owner))
)

(define-read-only (get-achievement-count (owner principal))
  (default-to u0 (map-get? achievement-count-by-owner owner))
)

(define-read-only (get-achievement-update (owner principal) (id uint))
  (map-get? achievement-updates { owner: owner, id: id })
)

(define-private (validate-hash (hash (buff 32)))
  (if (is-eq (len hash) u32)
      (ok true)
      (err ERR-INVALID-HASH))
)

(define-private (validate-title (title (string-utf8 100)))
  (if (and (> (len title) u0) (<= (len title) u100))
      (ok true)
      (err ERR-INVALID-TITLE))
)

(define-private (validate-description (desc (string-utf8 500)))
  (if (<= (len desc) u500)
      (ok true)
      (err ERR-INVALID-DESCRIPTION))
)

(define-private (validate-category (cat (string-utf8 50)))
  (if (or (is-eq cat "academic") (is-eq cat "extracurricular") (is-eq cat "award") (is-eq cat "project"))
      (ok true)
      (err ERR-INVALID-CATEGORY))
)

(define-private (validate-timestamp (ts uint))
  (if (<= ts block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP))
)

(define-private (validate-visibility (vis bool))
  (ok true)
)

(define-private (validate-metadata (meta (optional (string-utf8 200))))
  (match meta m (if (<= (len m) u200) (ok true) (err ERR-INVALID-METADATA)) (ok true))
)

(define-private (validate-expiry (exp (optional uint)))
  (match exp e (if (> e block-height) (ok true) (err ERR-INVALID-EXPIRY)) (ok true))
)

(define-private (validate-status (stat bool))
  (ok true)
)

(define-private (validate-rating (rat uint))
  (if (<= rat u5)
      (ok true)
      (err ERR-INVALID-RATING))
)

(define-private (validate-comment (com (optional (string-utf8 200))))
  (match com c (if (<= (len c) u200) (ok true) (err ERR-INVALID-COMMENT)) (ok true))
)

(define-private (validate-attachment (att (optional (buff 64))))
  (match att a (if (<= (len a) u64) (ok true) (err ERR-INVALID-ATTACHMENT)) (ok true))
)

(define-private (validate-score (sc uint))
  (if (<= sc u100)
      (ok true)
      (err ERR-INVALID-SCORE))
)

(define-private (validate-level (lv uint))
  (if (<= lv u10)
      (ok true)
      (err ERR-INVALID-LEVEL))
)

(define-public (set-max-achievements (new-max uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin-principal)) (err ERR-NOT-AUTHORIZED))
    (asserts! (> new-max u0) (err ERR-INVALID-UPDATE))
    (var-set max-achievements-per-user new-max)
    (ok true)
  )
)

(define-public (set-storage-fee (new-fee uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin-principal)) (err ERR-NOT-AUTHORIZED))
    (asserts! (>= new-fee u0) (err ERR-INVALID-UPDATE))
    (var-set storage-fee new-fee)
    (ok true)
  )
)

(define-public (add-achievement
  (hash (buff 32))
  (title (string-utf8 100))
  (description (string-utf8 500))
  (category (string-utf8 50))
  (visibility bool)
  (metadata (optional (string-utf8 200)))
  (expiry (optional uint))
  (status bool)
  (rating uint)
  (comment (optional (string-utf8 200)))
  (attachment (optional (buff 64)))
  (score uint)
  (level uint)
)
  (let (
        (owner tx-sender)
        (current-count (get-achievement-count owner))
        (next-id (var-get next-achievement-id))
        (ids (get-achievement-ids owner))
      )
    (asserts! (< current-count (var-get max-achievements-per-user)) (err ERR-MAX-ACHIEVEMENTS-EXCEEDED))
    (try! (validate-hash hash))
    (try! (validate-title title))
    (try! (validate-description description))
    (try! (validate-category category))
    (try! (validate-visibility visibility))
    (try! (validate-metadata metadata))
    (try! (validate-expiry expiry))
    (try! (validate-status status))
    (try! (validate-rating rating))
    (try! (validate-comment comment))
    (try! (validate-attachment attachment))
    (try! (validate-score score))
    (try! (validate-level level))
    (asserts! (is-none (map-get? achievements { owner: owner, id: next-id })) (err ERR-ACHIEVEMENT-ALREADY-EXISTS))
    (try! (stx-transfer? (var-get storage-fee) tx-sender (var-get admin-principal)))
    (map-set achievements { owner: owner, id: next-id }
      {
        hash: hash,
        title: title,
        description: description,
        category: category,
        timestamp: block-height,
        visibility: visibility,
        metadata: metadata,
        expiry: expiry,
        status: status,
        rating: rating,
        comment: comment,
        attachment: attachment,
        score: score,
        level: level
      }
    )
    (map-set achievement-ids-by-owner owner (unwrap! (as-max-len? (append ids next-id) u100) (err ERR-MAX-ACHIEVEMENTS-EXCEEDED)))
    (map-set achievement-count-by-owner owner (+ current-count u1))
    (var-set next-achievement-id (+ next-id u1))
    (print { event: "achievement-added", owner: owner, id: next-id })
    (ok next-id)
  )
)

(define-public (update-achievement
  (id uint)
  (new-title (string-utf8 100))
  (new-description (string-utf8 500))
  (new-visibility bool)
)
  (let (
        (owner tx-sender)
        (achievement (map-get? achievements { owner: owner, id: id }))
      )
    (match achievement
      ach
        (begin
          (asserts! (is-eq owner tx-sender) (err ERR-NOT-AUTHORIZED))
          (try! (validate-title new-title))
          (try! (validate-description new-description))
          (try! (validate-visibility new-visibility))
          (map-set achievements { owner: owner, id: id }
            (merge ach
              {
                title: new-title,
                description: new-description,
                visibility: new-visibility,
                timestamp: block-height
              }
            )
          )
          (map-set achievement-updates { owner: owner, id: id }
            {
              update-timestamp: block-height,
              updater: tx-sender,
              changes: "Updated title, description, visibility"
            }
          )
          (print { event: "achievement-updated", owner: owner, id: id })
          (ok true)
        )
      (err ERR-ACHIEVEMENT-NOT-FOUND)
    )
  )
)

(define-public (delete-achievement (id uint))
  (let (
        (owner tx-sender)
        (achievement (map-get? achievements { owner: owner, id: id }))
      )
    (match achievement
      ach
        (begin
          (asserts! (is-eq owner tx-sender) (err ERR-NOT-AUTHORIZED))
          (map-delete achievements { owner: owner, id: id })
          (map-delete achievement-updates { owner: owner, id: id })
          (let (
                (ids (get-achievement-ids owner))
                (new-ids (filter (lambda (x) (not (is-eq x id))) ids))
              )
            (map-set achievement-ids-by-owner owner new-ids)
            (map-set achievement-count-by-owner owner (- (get-achievement-count owner) u1))
          )
          (print { event: "achievement-deleted", owner: owner, id: id })
          (ok true)
        )
      (err ERR-ACHIEVEMENT-NOT-FOUND)
    )
  )
)

(define-public (get-total-achievements)
  (ok (var-get next-achievement-id))
)