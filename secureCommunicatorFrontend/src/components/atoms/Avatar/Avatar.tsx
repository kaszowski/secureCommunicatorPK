import React from 'react';
import {
  Avatar as MuiAvatar,
  type AvatarProps as MuiAvatarProps,
} from '@mui/material';

interface AvatarProps extends MuiAvatarProps {
  username?: string;
}

const Avatar: React.FC<AvatarProps> = ({ username, children, ...props }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <MuiAvatar {...props}>
      {children || (username ? getInitials(username) : '?')}
    </MuiAvatar>
  );
};

export default Avatar;
