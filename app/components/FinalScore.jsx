import React, { useEffect, useState } from 'react';
import { Card, Text } from '@shopify/polaris';
import '../assets/css/FinalScore.css';

const FinalScore = ({ score }) => {
    // Ensure the score is within 0-100 range
    const normalizedScore = Math.max(0, Math.min(score, 100));

    // Circumference of the circle (2 * PI * radius)
    const radius = 45;
    const circumference = 2 * Math.PI * radius;

    // State to trigger animation
    const [offset, setOffset] = useState(circumference);

    useEffect(() => {
        // Start animation by setting the strokeDashoffset to the calculated value
        setOffset(strokeDashoffset);
    }, []);

    // Calculate strokeDashoffset based on the normalized score
    const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

    let color;
    let tone;
    if (score >= 90) {
        color = "#0CCE6B"; // Green
        tone ="success";
    } else if (score >= 50) {
        color = "#FFA400"; // Yellow
        tone ="caution";
    } else {
        color = "#FF4E42"; // Red
        tone = "critical";
    }

    return (
        <Card>
            <div className="score-container">
                <div className="score-module">
                    <svg className="ring" viewBox="0 0 100 100" width="200" height="150">
                        <circle
                            className="ring-background"
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke="#f1f2f4"
                            strokeWidth="13"
                        />
                        <circle
                            className="ring-progress"
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke={color}
                            strokeWidth="10"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            style={{
                                transition: 'stroke-dashoffset 1s ease-out',
                                transform: 'rotate(-90deg)',
                                transformOrigin: '50% 50%',
                            }}
                        />
                    </svg>
                    <div className="score">
                        <Text variant="heading3xl" tone={tone}>{normalizedScore}</Text>
                    </div>
                </div>
                <Text variant="headingLg" tone={tone}>Scan Score</Text>
            </div>
        </Card>
    );
};

export default FinalScore;
