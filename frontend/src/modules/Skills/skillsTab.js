import React, { useState, useEffect } from 'react'
import { request, formatSeconds, secondsRemaining } from 'modules/Base'

function SkillsTab({ updateUserData }) {
    console.log('SkillsTab rendered')

    const [skillsData, setSkillsData] = useState(null)

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
            updateUserData()

            setSkillsData(data => {
                return {
                    ...data,
                    [`${skillName}_cd`]: secondsRemaining(response.data.cd_remaining),
                    [`${skillName}_available`]: false,
                }
            })
        })
        .catch(error => {
            console.error("Error starting practice:", error)
        })
    }

    if (skillsData === null) {
        return <div>Loading...</div>
    }

    return (
        <>
        <div className="skillsCont" style={styles.skillsSection}>
            <div className="skillSection">
                <h3>Attack</h3>
                <button
                    className="practiceFreeBtn"
                    disabled={!skillsData.attack_free_available}
                    onClick={() => startPractice('attack_free')}
                >
                    Free training
                </button>
                {skillsData.attack_free_cd > 0 &&
                    <span> {formatSeconds(skillsData.attack_free_cd)}</span>
                }

                <button
                    className="practiceProBtn"
                    disabled={!skillsData.attack_pro_available}
                    onClick={() => startPractice('attack_pro')}
                >
                    Pro training
                </button>
                {skillsData.attack_pro_cd > 0 &&
                    <span> {formatSeconds(skillsData.attack_pro_cd)}</span>
                }
            </div>

            <div className="skillSection">
                <h3>Defense</h3>
                <button
                    className="practiceFreeBtn"
                    disabled={!skillsData.defense_free_available}
                    onClick={() => startPractice('defense_free')}
                >
                    Free training
                </button>
                {skillsData.defense_free_cd > 0 &&
                    <span> {formatSeconds(skillsData.defense_free_cd)}</span>
                }

                <button
                    className="practiceProBtn"
                    disabled={!skillsData.defense_pro_available}
                    onClick={() => startPractice('defense_pro')}
                >
                    Pro training
                </button>
                {skillsData.defense_pro_cd > 0 &&
                    <span> {formatSeconds(skillsData.defense_pro_cd)}</span>
                }
            </div>

            <div className="skillSection">
                <h3>Driving</h3>
                <button
                    className="practiceFreeBtn"
                    disabled={!skillsData.driving_free_available}
                    onClick={() => startPractice('driving_free')}
                >
                    Free training
                </button>
                {skillsData.driving_free_cd > 0 &&
                    <span> {formatSeconds(skillsData.driving_free_cd)}</span>
                }

                <button
                    className="practiceProBtn"
                    disabled={!skillsData.driving_pro_available}
                    onClick={() => startPractice('driving_pro')}
                >
                    Pro training
                </button>
                {skillsData.driving_pro_cd > 0 &&
                    <span> {formatSeconds(skillsData.driving_pro_cd)}</span>
                }
            </div>
        </div>
        </>
    )
}

const styles = {
}

export default SkillsTab