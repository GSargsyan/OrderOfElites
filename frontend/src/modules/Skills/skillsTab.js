import React, { useState, useEffect, useContext } from 'react'
import { request, formatSeconds, formatMoney, secondsRemaining } from 'modules/Base'
import { UserPreviewCtx } from 'modules/Dashboard'

const SKILL_CONFIG = {
    attack: {
        label: 'Attack',
        icon: '⚔',
        description: 'Increases your chances of a successful backfire and assassination against other players and NPCs during missions.',
    },
    defense: {
        label: 'Defense',
        icon: '🛡',
        description: 'Improves your chances of survival when other players make an assassination attempt on your life.',
    },
    driving: {
        label: 'Driving',
        icon: '🏎',
        description: 'Vastly improves mission outcomes when you\'re behind the wheel, and slightly tips assassination odds in your favor.',
    },
}

const SKILL_NAMES = ['attack', 'defense', 'driving']

function TrainingRow({ label, isPro, cost, points, cooldownDuration, cooldownRemaining, isAvailable, isDisabled, onTrain }) {
    const isCoolingDown = cooldownRemaining > 0
    const buttonText = isCoolingDown ? formatSeconds(cooldownRemaining) : 'Train'

    return (
        <div className={`training-subsection ${isPro ? 'pro' : 'free'}`}>
            <div className="training-label">{label}</div>
            <div className="training-row">
                <div className="training-info">
                    <span className="training-cost">
                        {cost === 0 ? 'Free' : formatMoney(cost)}
                    </span>
                    <span className="training-divider">·</span>
                    <span className="training-points">+{points} pt{points !== 1 ? 's' : ''}</span>
                    <span className="training-divider">·</span>
                    <span className="training-cooldown-info">
                        <span className="training-clock">🕐</span>
                        {formatSeconds(cooldownDuration)}
                    </span>
                </div>
                <button
                    className={`btn-train ${isPro ? 'pro' : 'free'} ${isCoolingDown ? 'cooldown' : ''}`}
                    disabled={!isAvailable || isDisabled}
                    onClick={onTrain}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    )
}

function SkillCard({ skillKey, skillsData, onTrain }) {
    const config = SKILL_CONFIG[skillKey]
    const freeKey = `${skillKey}_free`
    const proKey = `${skillKey}_pro`

    return (
        <div className="skill-card">
            <div className="skill-header">
                <span className="skill-icon">{config.icon}</span>
                <h3>{config.label}</h3>
            </div>
            <p className="skill-description">{config.description}</p>

            <TrainingRow
                label="Free Training"
                isPro={false}
                cost={0}
                points={skillsData.free_points}
                cooldownDuration={skillsData.free_cooldown}
                cooldownRemaining={skillsData[`${freeKey}_cd`]}
                isAvailable={skillsData[`${freeKey}_available`]}
                isDisabled={!skillsData[`${freeKey}_available`] && skillsData[`${freeKey}_cd`] <= 0}
                onTrain={() => onTrain(freeKey)}
            />

            <TrainingRow
                label="Pro Training"
                isPro={true}
                cost={skillsData[`${skillKey}_pro_price`]}
                points={skillsData.pro_points}
                cooldownDuration={skillsData.pro_cooldown}
                cooldownRemaining={skillsData[`${proKey}_cd`]}
                isAvailable={skillsData[`${proKey}_available`]}
                isDisabled={!skillsData[`${proKey}_available`] && skillsData[`${proKey}_cd`] <= 0}
                onTrain={() => onTrain(proKey)}
            />
        </div>
    )
}

function SkillsTab() {
    console.log('SkillsTab rendered')

    const [skillsData, setSkillsData] = useState(null)
    const { userPreviewData, updateUserPreviewData } = useContext(UserPreviewCtx)

    useEffect(() => {
        request({
            'url': 'users/get_skills_tab_data',
            'method': 'POST',
        })
        .then(response => {
            console.log('users/get_skills_tab_data')

            setSkillsData({
                    ...response.data,

                    attack_free_available: secondsRemaining(response.data.attack_free_cd) <= 0,
                    attack_pro_available: secondsRemaining(response.data.attack_pro_cd) <= 0,
                    defense_free_available: secondsRemaining(response.data.defense_free_cd) <= 0,
                    defense_pro_available: secondsRemaining(response.data.defense_pro_cd) <= 0,
                    driving_free_available: secondsRemaining(response.data.driving_free_cd) <= 0,
                    driving_pro_available: secondsRemaining(response.data.driving_pro_cd) <= 0,

                    attack_free_cd: secondsRemaining(response.data.attack_free_cd),
                    attack_pro_cd: secondsRemaining(response.data.attack_pro_cd),
                    defense_free_cd: secondsRemaining(response.data.defense_free_cd),
                    defense_pro_cd: secondsRemaining(response.data.defense_pro_cd),
                    driving_free_cd: secondsRemaining(response.data.driving_free_cd),
                    driving_pro_cd: secondsRemaining(response.data.driving_pro_cd),
            })
        })
        .catch(error => {
            console.error("Error getting skills tab data: ", error)
        })
    }, [])

    useEffect(() => {
        if (!skillsData) return

        const skills = ['attack_free',
            'attack_pro',
            'defense_free',
            'defense_pro',
            'driving_free',
            'driving_pro']

        const interval = setInterval(() => {

            skills.forEach(skill => {
                const cd = skillsData[`${skill}_cd`]
                if (cd > 0) {
                    setSkillsData(data => {
                        return {
                            ...data,
                            [`${skill}_cd`]: cd - 1,
                            [`${skill}_available`]: cd - 1 <= 0,
                        }
                    })
                }
            })
        }, 1000)

        return () => clearInterval(interval);
    }, [skillsData])

    const startPractice = (skillName) => {
        console.log(`users/start_practice/${skillName}`)
        request({
            'url': `users/start_skill_practice/${skillName}`,
            'method': 'POST',
        })
        .then(response => {
            updateUserPreviewData()

            setSkillsData(data => {
                const suffix = skillName.endsWith('_free') ? '_free' : '_pro'
                const cdSecs = secondsRemaining(response.data.cd_remaining)
                return {
                    ...data,
                    [`attack${suffix}_cd`]: cdSecs,
                    [`attack${suffix}_available`]: false,
                    [`defense${suffix}_cd`]: cdSecs,
                    [`defense${suffix}_available`]: false,
                    [`driving${suffix}_cd`]: cdSecs,
                    [`driving${suffix}_available`]: false,
                }
            })
        })
        .catch(error => {
            console.error("Error starting practice:", error)
        })
    }

    if (skillsData === null) {
        return <div className="loading-text">LOADING SKILLS...</div>
    }

    return (
        <div className="skills-container">
            {SKILL_NAMES.map(skillKey => (
                <SkillCard
                    key={skillKey}
                    skillKey={skillKey}
                    skillsData={skillsData}
                    onTrain={startPractice}
                />
            ))}
        </div>
    )
}

export default SkillsTab