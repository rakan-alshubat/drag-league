import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

/**
 * Countdown component that displays time remaining until a deadline
 * Automatically handles timezone conversion from UTC to user's local time
 * @param {string} deadline - ISO 8601 date string (UTC)
 * @param {string} label - Label to display above countdown
 * @param {boolean} showDate - Whether to show the full date/time
 * @param {boolean} compact - Whether to use compact inline styling
 */
export default function Countdown({ deadline, label = "Time Remaining", showDate = true, compact = false }) {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!deadline) return;

        const calculateTimeLeft = () => {
            const deadlineDate = new Date(deadline);
            const now = new Date();
            const difference = deadlineDate - now;

            if (difference <= 0) {
                setIsExpired(true);
                setTimeLeft(null);
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft({ days, hours, minutes, seconds });
            setIsExpired(false);
        };

        // Calculate immediately
        calculateTimeLeft();

        // Update every second
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [deadline]);

    if (!deadline) {
        return null;
    }

    const formatLocalDate = () => {
        try {
            const deadlineDate = new Date(deadline);
            const dayName = deadlineDate.toLocaleDateString(undefined, { weekday: 'long' });
            const date = deadlineDate.toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            const time = deadlineDate.toLocaleTimeString(undefined, { 
                hour: 'numeric', 
                minute: '2-digit',
                timeZoneName: 'short'
            });
            return `${dayName}, ${date} at ${time}`;
        } catch (e) {
            return deadline;
        }
    };

    const formatTimeLeft = () => {
        if (isExpired) {
            return "Deadline has passed";
        }
        
        if (!timeLeft) {
            return "Loading...";
        }

        const parts = [];
        if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
        if (timeLeft.hours > 0) parts.push(`${timeLeft.hours}h`);
        if (timeLeft.minutes > 0) parts.push(`${timeLeft.minutes}m`);
        if (timeLeft.seconds > 0 || parts.length === 0) parts.push(`${timeLeft.seconds}s`);
        
        return parts.join(' ');
    };

    if (compact) {
        return (
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    padding: '8px 12px',
                    border: '1px solid',
                    borderColor: isExpired ? 'error.main' : 'primary.main',
                    borderRadius: 1.5,
                    backgroundColor: isExpired ? 'rgba(220,20,60,0.06)' : 'primary.light',
                    width: 'auto',
                    maxWidth: '100%',
                    textAlign: 'center',
                }}
            >
                <AccessTimeIcon fontSize="small" color={isExpired ? 'error' : 'primary'} />
                <Typography 
                    variant="body2" 
                    fontWeight="bold" 
                    color={isExpired ? 'error.main' : 'primary.dark'}
                    sx={{
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%'
                    }}
                >
                    {formatTimeLeft()}
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 2,
                border: '1px solid',
                borderColor: isExpired ? 'error.main' : 'primary.main',
                borderRadius: 2,
                backgroundColor: isExpired ? 'rgba(220,20,60,0.04)' : 'primary.light',
                margin: '16px 0',
                textAlign: 'center'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTimeIcon color={isExpired ? 'error' : 'primary'} />
                <Typography variant="subtitle2" fontWeight="bold" color={isExpired ? 'error.main' : 'primary'}>
                    {label}
                </Typography>
            </Box>
            
            <Typography 
                variant="h4" 
                fontWeight="bold" 
                color={isExpired ? 'error.main' : 'primary.dark'}
                sx={{ fontFamily: 'monospace', textAlign: 'center' }}
            >
                {formatTimeLeft()}
            </Typography>
            
            {showDate && !isExpired && (
                <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mt: 1, textAlign: 'center' }}
                >
                    {formatLocalDate()}
                </Typography>
            )}
        </Box>
    );
}

Countdown.propTypes = {
    deadline: PropTypes.string,
    label: PropTypes.string,
    showDate: PropTypes.bool,
    compact: PropTypes.bool,
};
