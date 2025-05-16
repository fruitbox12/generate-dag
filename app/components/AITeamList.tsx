'use client';

import React, { useState } from 'react';
import Image from 'next/image';

// AI团队成员接口定义
export interface AITeamMember {
  id: string;
  name: string;
  avatarSrc: string;
  role: string;
}

// 组件属性接口
interface AITeamListProps {
  onSelectTeamMember?: (member: AITeamMember) => void;
  activeId?: string;
}

// 默认AI团队成员数据 - 修改为User和Leader两个角色
const defaultTeamMembers: AITeamMember[] = [
  {
    id: '1',
    name: 'User',
    avatarSrc: '/vercel.svg', // 使用已有资源作为临时头像
    role: 'Daily task requirement proposal and description'
  },
  {
    id: '2',
    name: 'Leader',
    avatarSrc: '/globe.svg', // 使用已有资源作为临时头像
    role: 'Team leader, responsible for task planning and coordination'
  }
];

/**
 * AI团队列表组件
 * 显示可选的AI团队成员，支持水平滚动
 */
export default function AITeamList({ onSelectTeamMember, activeId = '1' }: AITeamListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSelectMember = (member: AITeamMember) => {
    if (onSelectTeamMember) {
      onSelectTeamMember(member);
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
      <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 ml-1">AI Team</h3>
      <div className="flex overflow-x-auto space-x-5 pt-2">
        {defaultTeamMembers.map((member) => {
          const isActive = member.id === activeId;
          const isHovered = member.id === hoveredId;
          
          return (
            <button
              type="button"
              key={member.id}
              className={`
                flex flex-col items-center cursor-pointer min-w-[70px] 
                bg-transparent border-0 p-0 transition-all duration-300 ease-in-out
                ${isActive ? 'scale-105' : 'scale-100'}
                ${isHovered ? 'transform translate-y-[-1px]' : ''}
              `}
              onClick={() => handleSelectMember(member)}
              onMouseEnter={() => setHoveredId(member.id)}
              onMouseLeave={() => setHoveredId(null)}
              aria-label={`Select AI team members: ${member.name}`}
              title={member.role}
            >
              <div className={`
                relative w-10 h-10 mb-1.5 rounded-full overflow-hidden
                bg-white dark:bg-gray-800 
                ${isActive 
                  ? 'ring-2 ring-blue-500 shadow-md' 
                  : 'border-2 border-gray-200 dark:border-gray-600 shadow-sm'}
                transition-all duration-300
              `}>
                <Image
                  src={member.avatarSrc}
                  alt={member.name}
                  fill
                  className={`
                    object-contain p-2
                    ${isActive ? 'opacity-100' : 'opacity-85'}
                    transition-opacity duration-300
                  `}
                />
                {isActive && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-800" />
                )}
              </div>
              <span className={`
                text-xs font-medium text-center w-full
                ${isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400'}
                transition-colors duration-300
              `}>
                {member.name}
              </span>
              {isActive && (
                <div className="h-0.5 w-5 bg-blue-500 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
} 