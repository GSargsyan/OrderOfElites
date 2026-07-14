import React, { useState, useEffect, useContext } from 'react'
import { formatMoney, request } from 'modules/Base'
import { UserPreviewCtx } from 'modules/Dashboard'

function StarRating({ rating, interactive = false, onRatingChange = null }) {
    const stars = []
    const fullRating = Math.round(rating || 0)

    for (let i = 1; i <= 5; i++) {
        const isFilled = i <= fullRating
        stars.push(
            <span
                key={i}
                className={`star-icon ${isFilled ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
                onClick={interactive && onRatingChange ? () => onRatingChange(i) : undefined}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
            >
                ★
            </span>
        )
    }
    return <div className="star-rating-container">{stars}</div>
}

function UserProfileModal({ userProfileData, onClose, onMessageClick }) {
    console.log('UserProfileModal rendered')
    console.log(userProfileData)

    const { userPreviewData } = useContext(UserPreviewCtx)
    const loggedInUsername = userPreviewData?.username

    const [profileData, setProfileData] = useState(userProfileData)
    const [rating, setRating] = useState(5)
    const [reviewText, setReviewText] = useState('')
    const [cooldown, setCooldown] = useState(userProfileData.cooldown_seconds || 0)
    const [error, setError] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        setProfileData(userProfileData)
        setCooldown(userProfileData.cooldown_seconds || 0)
        setError(null)
    }, [userProfileData])

    // Cooldown countdown timer
    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [cooldown])

    const handleBackdropClick = () => {
        onClose()
    }

    const handleModalClick = (e) => {
        e.stopPropagation()
    }

    const handleSubmittingReview = (e) => {
        e.preventDefault()
        if (!reviewText.trim()) {
            setError('Review text cannot be empty')
            return
        }
        setError(null)
        setIsSubmitting(true)

        request({
            url: 'users/add_review',
            method: 'POST',
            data: {
                reviewed_username: profileData.username,
                rating: rating,
                text: reviewText.trim()
            }
        })
        .then(response => {
            setProfileData(response.data)
            setCooldown(response.data.cooldown_seconds || 0)
            setReviewText('')
            setRating(5)
            setIsSubmitting(false)
        })
        .catch(err => {
            console.error('Failed to submit review:', err)
            setError(err.response?.data?.message || 'Failed to submit review')
            setIsSubmitting(false)
        })
    }

    const formatCooldown = (seconds) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${hours} hour(s) and ${minutes} minute(s)`
    }

    const formatDate = (isoString) => {
        const date = new Date(isoString)
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const isOwnProfile = profileData.username === loggedInUsername

    return (
        <div className="profile-backdrop" onClick={handleBackdropClick}>
            <div className="profile-modal" onClick={handleModalClick}>
                <h3>Operative Dossier</h3>
                
                <div className="profile-content">
                    <div className="profile-stats-card">
                        <p><strong>Username:</strong> {profileData.username}</p>
                        <p><strong>Rank:</strong> {profileData.rank}</p>
                        <div className="profile-rating-overall">
                            <strong>Rating:</strong>
                            {profileData.overall_rating ? (
                                <div className="overall-rating-info">
                                    <StarRating rating={profileData.overall_rating} />
                                    <span className="rating-number">{profileData.overall_rating} / 5</span>
                                    <span className="reviews-count">({profileData.reviews_count} reviews)</span>
                                </div>
                            ) : (
                                <span className="no-rating">No ratings yet</span>
                            )}
                        </div>
                    </div>

                    <div className="reviews-section">
                        <h4>Dossier Reviews</h4>
                        {profileData.reviews && profileData.reviews.length > 0 ? (
                            <div className="reviews-list">
                                {profileData.reviews.map(review => (
                                    <div key={review.id} className="review-item">
                                        <div className="review-header">
                                            <span className="review-reviewer">{review.reviewer}</span>
                                            <StarRating rating={review.rating} />
                                        </div>
                                        <p className="review-text">{review.text}</p>
                                        <span className="review-date">{formatDate(review.created_at)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-reviews-text">No reviews have been left for this operative.</p>
                        )}
                    </div>
                </div>

                {!isOwnProfile && (
                    <div className="write-review-section">
                        {cooldown > 0 ? (
                            <div className="cooldown-notice">
                                You must wait {formatCooldown(cooldown)} before writing another review.
                            </div>
                        ) : (
                            <form className="write-review-form" onSubmit={handleSubmittingReview}>
                                <h4>Leave a Review</h4>
                                <div className="star-picker-container">
                                    <span>Your Rating:</span>
                                    <StarRating rating={rating} interactive={true} onRatingChange={setRating} />
                                </div>
                                <div className="textarea-container">
                                    <textarea
                                        className="review-textarea"
                                        placeholder="Write your dossier review..."
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        maxLength={250}
                                        rows={3}
                                        disabled={isSubmitting}
                                    />
                                    <span className="char-counter">{reviewText.length} / 250</span>
                                </div>
                                {error && <div className="review-error-message">{error}</div>}
                                <button
                                    type="submit"
                                    className="btn-profile primary submit-review-btn"
                                    disabled={isSubmitting || !reviewText.trim()}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                <div className="profile-modal-actions">
                    <button
                        className="btn-profile ghost"
                        onClick={onClose}
                    >Close</button>
                    {!isOwnProfile && (
                        <button
                            className="btn-profile primary"
                            onClick={() => { onMessageClick(profileData.username) }}
                        >Message</button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserProfileModal