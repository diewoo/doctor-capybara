import { SearchForm } from "@/components/ui/search-form";
import { Link } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/i18n";
import { Home, MessageSquare, User, Settings, LogOut } from "lucide-react";

// Datos de navegación mejorados
const data = {
  navMain: [
    {
      title: "sidebarNavigation" as keyof typeof translations.es,
      items: [
        {
          title: "sidebarHome" as keyof typeof translations.es,
          url: "/",
          icon: Home,
        },
        // {
        //   title: "chatYourConsultation" as keyof typeof translations.es,
        //   url: "/dashboard/chat",
        //   icon: MessageSquare,
        // },
        // {
        //   title: "chatYourProfile" as keyof typeof translations.es,
        //   url: "/profile",
        //   icon: User,
        // },
      ],
    },
    // {
    //   title: "sidebarSettings" as keyof typeof translations.es,
    //   items: [
    //     {
    //       title: "sidebarSettingsText" as keyof typeof translations.es,
    //       url: "/settings",
    //       icon: Settings,
    //     },
    //     {
    //       title: "sidebarLogout" as keyof typeof translations.es,
    //       url: "/logout",
    //       icon: LogOut,
    //     },
    //   ],
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useLanguage();

  return (
    <Sidebar {...props}>
      {/* <SidebarHeader className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">🦫</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Doctor Capybara</h1>
            <p className="text-sm text-gray-500">Tu asistente de salud</p>
          </div>
        </div>
      </SidebarHeader> */}

      <SidebarContent className="flex-1">
        {data.navMain.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex} className="mb-6">
            <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
              {t(group.title)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link
                          to={item.url}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <IconComponent className="h-5 w-5 text-gray-600" />
                          <span className="text-gray-700">{t(item.title)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
