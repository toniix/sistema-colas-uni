import {
  AppShell,
  Avatar,
  Badge,
  Burger,
  Group,
  Menu,
  NavLink,
  ScrollArea,
  Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconLogout, IconChevronRight } from '@tabler/icons-react'
import { NavLink as RouterNavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ROL_LABEL } from '../lib/constants'
import { NAV } from './navConfig'
import Brand from '../components/Brand'

export default function AppLayout() {
  const [opened, { toggle, close }] = useDisclosure()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const items = NAV[user.rol] || []
  const iniciales = user.nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="lg"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Brand />
          </Group>

          <Menu position="bottom-end" width={220} shadow="md">
            <Menu.Target>
              <Group gap="xs" style={{ cursor: 'pointer' }} wrap="nowrap">
                <Avatar color="teal" radius="xl" size={34}>
                  {iniciales}
                </Avatar>
                <div style={{ lineHeight: 1.2 }} className="hide-mobile">
                  <Text size="sm" fw={600}>
                    {user.nombre}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {ROL_LABEL[user.rol]}
                  </Text>
                </div>
              </Group>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{user.email}</Menu.Label>
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={16} />}
                onClick={async () => {
                  await logout()
                  navigate('/login')
                }}
              >
                Cerrar sesión
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <AppShell.Section grow component={ScrollArea}>
          {items.map((item) => {
            const active =
              location.pathname === item.to ||
              location.pathname.startsWith(item.to + '/')
            return (
              <NavLink
                key={item.to}
                component={RouterNavLink}
                to={item.to}
                label={item.label}
                leftSection={<item.icon size={19} stroke={1.6} />}
                rightSection={active ? <IconChevronRight size={14} /> : null}
                active={active}
                onClick={close}
                mb={4}
                variant="light"
              />
            )
          })}
        </AppShell.Section>
        <AppShell.Section>
          <Group justify="space-between" px="xs" py={6}>
            <Text size="xs" c="dimmed">
              Rol activo
            </Text>
            <Badge variant="light" color="teal" size="sm">
              {ROL_LABEL[user.rol]}
            </Badge>
          </Group>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
