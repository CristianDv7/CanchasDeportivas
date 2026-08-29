# NOTA (Brando, verificado contra el código real de backend/ el 2026-08-28,
# confirmado como decisión de diseño el 2026-08-29):
# el modelo de contenedores de abajo dibuja dbUsers/dbCourts/dbReservations
# como 3 bases de datos separadas. En el código real (backend/docker-compose.yml
# + backend/database/init/01-create-schemas.sql) hay UNA sola instancia
# Postgres ("backend-postgres", puerto 5433, DB "backend") con 3 schemas
# lógicos (usuarios/canchas/reservas), no 3 instancias — decisión documentada
# como ADR-01 (Backend) en el informe arquitectónico. Esto NO es una
# inconsistencia del diagrama: a nivel C4 Contenedores (Nivel 2) se modela la
# separación lógica de ownership de datos por dominio (cada ms-* dueño de su
# store), independiente del detalle de implementación física (schema vs.
# instancia), que pertenece a un nivel de abstracción más bajo. Se mantiene
# así a propósito.
# ms-reportes no tiene base de datos propia: es un agregador puro que
# consulta ms-canchas y ms-reservas vía HTTP.

workspace "Name" "CanchasDeportivas" {

    !identifiers hierarchical

    model {
        finalUser = person "Usuario"
        administrator = person "Administrador"
        sportCourt = softwareSystem "Sistema de Reserva Canchas Deportivas" {
            wa = container "Aplicacion Web"
            shell = container "Shell/Host" {
                group "Enrutamiento y Guardas" {
                    appRouter = component "App Router" "Define las rutas raíz y monta cada microfrontend vía Module Federation." "React Router"
                    rootLayout = component "Root Layout" "Layout persistente: header, navegación condicionada por rol y logout." "React"
                    remoteBoundary = component "Remote Boundary" "Aísla la carga de cada remote con Suspense + ErrorBoundary." "React"
                    requireAuth = component "Require Auth Guard" "Bloquea el acceso a rutas protegidas sin sesión activa." "React"
                    requireRole = component "Require Role Guard" "Bloquea el acceso por rol no autorizado (RN-03/RN-07 admin)." "React"
                }
                group "Estado Federado" {
                    sessionStore = component "Session Store" "Fuente única de la sesión, expuesta a los remotes como shell/session." "Module Federation"
                    apiClient = component "Api Client" "Cliente HTTP singleton con la URL base y el token de sesión, expuesto como shell/apiClient." "Module Federation"
                }
            }

            mfReservation = container "Mf Reservas" {
                group "Presentación" {
                    disponibilidadFeature = component "Disponibilidad" "Grilla de disponibilidad por cancha y fecha (RN-01/RN-02)." "React"
                    nuevaReservaFeature = component "Nueva Reserva" "Formulario de alta de reserva (RN-02/RN-06)." "React"
                    misReservasFeature = component "Mis Reservas" "Listado de reservas propias con cancelación (RN-03/RN-04/RN-05/RN-08)." "React"
                }
                group "Dominio" {
                    domainRules = component "Reglas de Dominio" "canCancel, contarActivas, estadoBadge — reglas de negocio espejadas en el cliente (RN-04/RN-06/RN-08)." "TypeScript"
                    dataHooks = component "Hooks de Datos" "useResource / useAction — fetching y mutaciones sin caché compartida." "React Hooks"
                }
                group "Adapter" {
                    reservasAdapter = component "Adapter de Reservas" "Único punto de acceso a /reservas — traduce DTOs y mapea errores." "TypeScript"
                    canchasAdapter = component "Adapter de Canchas" "Consulta canchas y horarios de atención." "TypeScript"
                }
            }

            mfAdmin =  container "Mf Admin" {
                group "Presentación" {
                    # App.tsx todavía monta únicamente RemoteHealthCard; esta feature
                    # existe en el código pero aún no está enrutada (en transición al
                    # 2026-08-28).
                    canchasFeature = component "Gestión de Canchas" "Alta, edición, inactivación y horarios semanales (RN-07)." "React"
                }
                group "Dominio" {
                    domainRules = component "Reglas de Dominio" "validarHorario, contarAfectadasPorInactivar, estadoBadge — sin bypass de RN-04 para el admin." "TypeScript"
                    dataHooks = component "Hooks de Datos" "useResource / useAction." "React Hooks"
                }
                group "Adapter" {
                    canchasAdapter = component "Adapter de Canchas" "CRUD de canchas, deportes y horarios de atención." "TypeScript"
                    # Implementados pero sin feature que los consuma todavía (RN-03 admin).
                    reservasAdminAdapter = component "Adapter de Reservas (Admin)" "Consulta y cancela reservas de cualquier usuario (RN-03 admin)." "TypeScript"
                    usuariosAdapter = component "Adapter de Usuarios" "Consulta usuarios para el panel de administración." "TypeScript"
                }
            }

            mfReports = container "Mf Reportes" {
                # Diseño objetivo — App.tsx hoy solo monta RemoteHealthCard, pero el
                # diagrama guía la implementación siguiendo el mismo patrón ya
                # validado en Mf Reservas y Mf Admin (Presentación / Adapter / Hooks).
                group "Presentación" {
                    reportesFeature = component "Reportes" "Muestra ocupación por cancha y reservas por período." "React"
                }
                group "Adapter" {
                    reportesAdapter = component "Adapter de Reportes" "Consulta ocupación por cancha y reservas por período." "TypeScript"
                }
                group "Datos" {
                    dataHooks = component "Hooks de Datos" "useResource — fetching sin caché compartida." "React Hooks"
                }
            }

            apiGateway = container "Api Gateway" {
                # Diseño objetivo — apigateway/ aún no está implementado. Componentes
                # basados en docs/propuestas/apigateway-guia-implementacion.md
                # (contrato de rutas ya verificado contra el proxy de dev del shell).
                group "Enrutamiento" {
                    usuariosRouter = component "Router de Usuarios" "Enruta /api/usuarios/* (incluye /auth y /usuarios) hacia Ms Usuarios." "HTTPS / REST"
                    canchasRouter = component "Router de Canchas" "Enruta /api/canchas/* hacia Ms Canchas (canchas, deportes, horarios de atención)." "HTTPS / REST"
                    reservasRouter = component "Router de Reservas" "Enruta /api/reservas/* hacia Ms Reservas." "HTTPS / REST"
                    reportesRouter = component "Router de Reportes" "Enruta /api/reportes/* hacia Ms Reportes." "HTTPS / REST"
                }
                group "Transversal" {
                    corsMiddleware = component "Middleware CORS" "Permite el origen del Shell — único punto del backend que necesita CORS." "Middleware"
                    forwardingProxy = component "Reverse Proxy" "Reenvía método, headers (incluido Authorization sin validar), body, query params y status code, sin lógica de negocio propia." "httpx"
                }
            }

            msUsers = container "Ms Usuarios" {
                group "API" {
                    authApi = component "API de Autenticación" "Recibe solicitudes de login." "HTTPS / REST"
                    usuariosApi = component "API de Usuarios" "Recibe solicitudes CRUD de usuarios." "HTTPS / REST"
                }
                group "Dominio" {
                    authenticationManager = component "Gestor de Autenticación" "Valida credenciales y emite/decodifica el JWT (HS256)." "Componente de dominio"
                    userManager = component "Gestor de Usuarios" "Administra alta, consulta y asignación de roles." "Componente de dominio"
                    accessGuard = component "Guardia de Acceso" "Resuelve el usuario autenticado y exige rol admin donde corresponde." "Componente de dominio"
                }
                group "Persistencia" {
                    usuarioRepository = component "Repositorio de Usuarios" "Persiste y consulta usuarios y credenciales." "PostgreSQL / SQL"
                    roleRepository = component "Repositorio de Roles" "Persiste y consulta roles." "PostgreSQL / SQL"
                }
            }

            msCourts = container "Ms Canchas" {
                group "API" {
                    canchasApi = component "API de Canchas" "Recibe solicitudes de alta, edición e inactivación de canchas (RN-07)." "HTTPS / REST"
                    deportesApi = component "API de Deportes" "Recibe solicitudes de consulta del catálogo de deportes." "HTTPS / REST"
                    horariosApi = component "API de Horarios de Atención" "Recibe solicitudes de horario de atención por cancha (RN-07)." "HTTPS / REST"
                }
                group "Dominio" {
                    canchaManager = component "Gestor de Canchas" "Administra alta, edición e inactivación de canchas." "Componente de dominio"
                    deporteManager = component "Gestor de Deportes" "Administra el catálogo de deportes." "Componente de dominio"
                    horarioManager = component "Gestor de Horarios de Atención" "Administra el horario de atención por cancha." "Componente de dominio"
                    accessGuard = component "Guardia de Acceso" "Valida el JWT y exige rol admin para altas y ediciones." "Componente de dominio"
                }
                group "Persistencia" {
                    canchaRepository = component "Repositorio de Canchas" "Persiste y consulta canchas." "PostgreSQL / SQL"
                    deporteRepository = component "Repositorio de Deportes" "Persiste y consulta deportes." "PostgreSQL / SQL"
                    horarioRepository = component "Repositorio de Horarios de Atención" "Persiste y consulta horarios de atención." "PostgreSQL / SQL"
                }
            }

            msReservations = container "Ms Reservas" {
                group "API" {
                    reservasApi = component "API de Reservas" "Recibe solicitudes de disponibilidad, creación y cancelación de reservas." "HTTPS / REST"
                }
                group "Dominio" {
                    reservaManager = component "Gestor de Reservas" "Aplica las reglas de negocio de reservas: solapamiento (RN-02), cancelación (RN-04/RN-05) y límite activo (RN-06)." "Componente de dominio"
                    accessGuard = component "Guardia de Acceso" "Valida el JWT y resuelve el usuario y rol del solicitante (RN-03)." "Componente de dominio"
                }
                group "Integración" {
                    canchasClient = component "Cliente de Canchas" "Valida la existencia de la cancha y su horario de atención (RN-01)." "HTTPS / REST"
                    usuariosClient = component "Cliente de Usuarios" "Valida la existencia del usuario solicitante." "HTTPS / REST"
                }
                group "Persistencia" {
                    reservaRepository = component "Repositorio de Reservas" "Persiste y consulta reservas, fechas y bloques horarios." "PostgreSQL / SQL"
                }
            }

            msReports = container "Ms Reportes" {
                group "API" {
                    reportesApi = component "API de Reportes" "Recibe solicitudes de ocupación por cancha y reservas por período." "HTTPS / REST"
                }
                group "Dominio" {
                    reportAggregationService = component "Servicio de Agregación de Reportes" "Calcula ocupación por cancha y reservas por período en memoria." "Componente de dominio"
                    accessGuard = component "Guardia de Acceso" "Valida el JWT del solicitante y lo propaga a los servicios consultados." "Componente de dominio"
                }
                group "Integración" {
                    externalClient = component "Cliente HTTP de Servicios Externos" "Consulta canchas y reservas propagando el token del solicitante. Sin base de datos propia." "HTTPS / REST"
                }
            }

            dbUsers = container "Database Users" {
                tags "Database"
            }
            dbCourts = container "Database Courts" {
                tags "Database"
            }
            dbReservations = container "Database Reservations" {
                tags "Database"
            }
        }

        finalUser -> sportCourt.wa "Consulta disponibilidad, crea reservas y cancela sus propias reservas"
        administrator -> sportCourt.wa "Gestiona canchas, horarios, reservas, usuarios y consulta reportes"


        sportCourt.wa -> sportCourt.shell "Utiliza el layout, navegación, autenticación y orquestación de microfrontends"
        sportCourt.shell -> sportCourt.mfReservation "Carga y orquesta el microfrontend de reservas mediante Module Federation"
        sportCourt.shell -> sportCourt.mfAdmin "Carga y orquesta el microfrontend de administración mediante Module Federation"
        sportCourt.shell -> sportCourt.mfReports "Carga y orquesta el microfrontend de reportes mediante Module Federation"

        sportCourt.mfReservation -> sportCourt.apiGateway "Solicita disponibilidad, creación y cancelación de reservas mediante REST"
        sportCourt.mfAdmin -> sportCourt.apiGateway "Solicita gestión de canchas, horarios, usuarios y reservas mediante REST"
        sportCourt.mfReports -> sportCourt.apiGateway "Solicita información para generar reportes mediante REST"

        sportCourt.apiGateway -> sportCourt.msUsers "Enruta solicitudes de autenticación y gestión de usuarios mediante REST"
        sportCourt.apiGateway -> sportCourt.msCourts "Enruta solicitudes de gestión de canchas, deportes y horarios mediante REST"
        sportCourt.apiGateway -> sportCourt.msReservations "Enruta solicitudes de disponibilidad, creación y cancelación de reservas mediante REST"
        sportCourt.apiGateway -> sportCourt.msReports "Enruta solicitudes de generación de reportes mediante REST"

        sportCourt.msReports -> sportCourt.msCourts "Consulta información de canchas y horarios para generar reportes mediante REST"
        sportCourt.msReports -> sportCourt.msReservations "Consulta información de reservas y cancelaciones para generar reportes mediante REST"

        sportCourt.msUsers -> sportCourt.dbUsers "Lee y almacena usuarios, roles y credenciales"
        sportCourt.msCourts -> sportCourt.dbCourts "Lee y almacena canchas, deportes, horarios y bloqueos"
        sportCourt.msReservations -> sportCourt.dbReservations "Lee y almacena reservas, fechas, bloques horarios y estados"

        # --- Relaciones de componentes (derivadas del código real, 2026-08-28) ---

        # Ms Usuarios
        sportCourt.msUsers.authApi -> sportCourt.msUsers.authenticationManager "Delega la validación de credenciales y la emisión del token"
        sportCourt.msUsers.authenticationManager -> sportCourt.msUsers.usuarioRepository "Verifica credenciales y busca el usuario"
        sportCourt.msUsers.usuariosApi -> sportCourt.msUsers.accessGuard "Valida el token y el rol del solicitante"
        sportCourt.msUsers.usuariosApi -> sportCourt.msUsers.userManager "Delega las operaciones CRUD"
        sportCourt.msUsers.accessGuard -> sportCourt.msUsers.authenticationManager "Reutiliza la decodificación del token"
        sportCourt.msUsers.userManager -> sportCourt.msUsers.usuarioRepository "Lee y escribe usuarios"
        sportCourt.msUsers.userManager -> sportCourt.msUsers.roleRepository "Lee y escribe roles"
        sportCourt.msUsers.usuarioRepository -> sportCourt.dbUsers "Lee y escribe usuarios y credenciales" "SQL"
        sportCourt.msUsers.roleRepository -> sportCourt.dbUsers "Lee y escribe roles" "SQL"

        # Ms Canchas
        sportCourt.msCourts.canchasApi -> sportCourt.msCourts.accessGuard "Valida el token y exige rol admin para altas y ediciones"
        sportCourt.msCourts.canchasApi -> sportCourt.msCourts.canchaManager "Delega la gestión de canchas"
        sportCourt.msCourts.deportesApi -> sportCourt.msCourts.deporteManager "Delega la consulta del catálogo"
        sportCourt.msCourts.horariosApi -> sportCourt.msCourts.accessGuard "Valida el token y exige rol admin"
        sportCourt.msCourts.horariosApi -> sportCourt.msCourts.horarioManager "Delega la gestión del horario de atención"
        sportCourt.msCourts.canchaManager -> sportCourt.msCourts.canchaRepository "Lee y escribe canchas"
        sportCourt.msCourts.deporteManager -> sportCourt.msCourts.deporteRepository "Lee y escribe deportes"
        sportCourt.msCourts.horarioManager -> sportCourt.msCourts.horarioRepository "Lee y escribe horarios de atención"
        sportCourt.msCourts.canchaRepository -> sportCourt.dbCourts "Lee y escribe canchas" "SQL"
        sportCourt.msCourts.deporteRepository -> sportCourt.dbCourts "Lee y escribe deportes" "SQL"
        sportCourt.msCourts.horarioRepository -> sportCourt.dbCourts "Lee y escribe horarios de atención" "SQL"

        # Ms Reservas
        sportCourt.msReservations.reservasApi -> sportCourt.msReservations.accessGuard "Valida el token y resuelve el usuario y rol del solicitante"
        sportCourt.msReservations.reservasApi -> sportCourt.msReservations.reservaManager "Delega la creación, consulta y cancelación"
        sportCourt.msReservations.reservaManager -> sportCourt.msReservations.canchasClient "Valida la cancha y su horario de atención (RN-01)"
        sportCourt.msReservations.reservaManager -> sportCourt.msReservations.usuariosClient "Valida el usuario solicitante"
        sportCourt.msReservations.reservaManager -> sportCourt.msReservations.reservaRepository "Lee y escribe reservas; valida solapamiento (RN-02) y límite activo (RN-06)"
        sportCourt.msReservations.canchasClient -> sportCourt.msCourts.canchasApi "Consulta la cancha" "HTTPS / REST"
        sportCourt.msReservations.canchasClient -> sportCourt.msCourts.horariosApi "Consulta el horario de atención" "HTTPS / REST"
        sportCourt.msReservations.usuariosClient -> sportCourt.msUsers.usuariosApi "Consulta el usuario" "HTTPS / REST"
        sportCourt.msReservations.reservaRepository -> sportCourt.dbReservations "Lee y escribe reservas" "SQL"

        # Ms Reportes (sin base de datos propia — agregador puro)
        sportCourt.msReports.reportesApi -> sportCourt.msReports.accessGuard "Valida el token del solicitante"
        sportCourt.msReports.reportesApi -> sportCourt.msReports.reportAggregationService "Solicita el cálculo del reporte"
        sportCourt.msReports.reportAggregationService -> sportCourt.msReports.externalClient "Solicita datos crudos de canchas y reservas"
        sportCourt.msReports.externalClient -> sportCourt.msCourts.canchasApi "Consulta canchas (propaga el JWT del solicitante)" "HTTPS / REST"
        sportCourt.msReports.externalClient -> sportCourt.msReservations.reservasApi "Consulta reservas (propaga el JWT del solicitante)" "HTTPS / REST"

        # Shell/Host
        sportCourt.shell.appRouter -> sportCourt.shell.requireAuth "Aplica el guard de autenticación sobre las rutas protegidas"
        sportCourt.shell.requireAuth -> sportCourt.shell.requireRole "Delega la validación de rol en /administracion y /reportes"
        sportCourt.shell.requireRole -> sportCourt.shell.remoteBoundary "Permite el montaje del remote autorizado"
        sportCourt.shell.remoteBoundary -> sportCourt.mfReservation "Carga bajo demanda" "Module Federation"
        sportCourt.shell.remoteBoundary -> sportCourt.mfAdmin "Carga bajo demanda" "Module Federation"
        sportCourt.shell.remoteBoundary -> sportCourt.mfReports "Carga bajo demanda" "Module Federation"
        sportCourt.shell.rootLayout -> sportCourt.shell.sessionStore "Lee el estado de sesión para el header y el logout"
        sportCourt.shell.requireAuth -> sportCourt.shell.sessionStore "Verifica si existe una sesión activa"
        sportCourt.shell.requireRole -> sportCourt.shell.sessionStore "Consulta el rol del usuario autenticado"
        sportCourt.shell.apiClient -> sportCourt.shell.sessionStore "Adjunta el token de sesión a cada request"

        # Mf Reservas — consume Session Store y Api Client federados del shell
        sportCourt.mfReservation.disponibilidadFeature -> sportCourt.mfReservation.dataHooks "Obtiene la disponibilidad"
        sportCourt.mfReservation.nuevaReservaFeature -> sportCourt.mfReservation.dataHooks "Envía la creación de la reserva"
        sportCourt.mfReservation.nuevaReservaFeature -> sportCourt.mfReservation.domainRules "Valida el límite de reservas activas antes de enviar (RN-06)"
        sportCourt.mfReservation.nuevaReservaFeature -> sportCourt.shell.sessionStore "Obtiene el usuarioId de la sesión (RN-03)" "Module Federation"
        sportCourt.mfReservation.misReservasFeature -> sportCourt.mfReservation.dataHooks "Obtiene y cancela reservas propias"
        sportCourt.mfReservation.misReservasFeature -> sportCourt.mfReservation.domainRules "Determina si la reserva es cancelable y su estado visual (RN-04/RN-08)"
        sportCourt.mfReservation.dataHooks -> sportCourt.mfReservation.reservasAdapter "Invoca operaciones de reservas"
        sportCourt.mfReservation.dataHooks -> sportCourt.mfReservation.canchasAdapter "Invoca consultas de canchas y horarios"
        sportCourt.mfReservation.reservasAdapter -> sportCourt.shell.apiClient "Ejecuta requests HTTP autenticados" "Module Federation"
        sportCourt.mfReservation.canchasAdapter -> sportCourt.shell.apiClient "Ejecuta requests HTTP autenticados" "Module Federation"

        # Mf Admin — canchasFeature es la única pieza montada hoy; los adapters de
        # reservas/usuarios están implementados pero sin feature que los consuma.
        sportCourt.mfAdmin.canchasFeature -> sportCourt.mfAdmin.dataHooks "Obtiene y muta canchas, deportes y horarios"
        sportCourt.mfAdmin.canchasFeature -> sportCourt.mfAdmin.domainRules "Valida horarios de atención y detecta reservas afectadas antes de inactivar (RN-07)"
        sportCourt.mfAdmin.dataHooks -> sportCourt.mfAdmin.canchasAdapter "Invoca operaciones de canchas"
        sportCourt.mfAdmin.canchasAdapter -> sportCourt.shell.apiClient "Ejecuta requests HTTP autenticados" "Module Federation"
        sportCourt.mfAdmin.reservasAdminAdapter -> sportCourt.shell.apiClient "Ejecuta requests HTTP autenticados (aún sin feature que lo consuma)" "Module Federation"
        sportCourt.mfAdmin.usuariosAdapter -> sportCourt.shell.apiClient "Ejecuta requests HTTP autenticados (aún sin feature que lo consuma)" "Module Federation"

        # Mf Reportes (diseño objetivo, mismo patrón que Mf Reservas / Mf Admin)
        sportCourt.mfReports.reportesFeature -> sportCourt.mfReports.dataHooks "Obtiene los datos del reporte"
        sportCourt.mfReports.dataHooks -> sportCourt.mfReports.reportesAdapter "Invoca las consultas de reportes"
        sportCourt.mfReports.reportesAdapter -> sportCourt.shell.apiClient "Ejecuta requests HTTP autenticados" "Module Federation"

        # Api Gateway (diseño objetivo, basado en docs/propuestas/apigateway-guia-implementacion.md)
        sportCourt.apiGateway.usuariosRouter -> sportCourt.apiGateway.forwardingProxy "Delega el reenvío de la solicitud"
        sportCourt.apiGateway.canchasRouter -> sportCourt.apiGateway.forwardingProxy "Delega el reenvío de la solicitud"
        sportCourt.apiGateway.reservasRouter -> sportCourt.apiGateway.forwardingProxy "Delega el reenvío de la solicitud"
        sportCourt.apiGateway.reportesRouter -> sportCourt.apiGateway.forwardingProxy "Delega el reenvío de la solicitud"
        sportCourt.apiGateway.corsMiddleware -> sportCourt.apiGateway.usuariosRouter "Autoriza el origen del Shell antes de enrutar"
        sportCourt.apiGateway.corsMiddleware -> sportCourt.apiGateway.canchasRouter "Autoriza el origen del Shell antes de enrutar"
        sportCourt.apiGateway.corsMiddleware -> sportCourt.apiGateway.reservasRouter "Autoriza el origen del Shell antes de enrutar"
        sportCourt.apiGateway.corsMiddleware -> sportCourt.apiGateway.reportesRouter "Autoriza el origen del Shell antes de enrutar"
        sportCourt.apiGateway.forwardingProxy -> sportCourt.msUsers.authApi "Reenvía /auth/*" "HTTPS / REST"
        sportCourt.apiGateway.forwardingProxy -> sportCourt.msUsers.usuariosApi "Reenvía /usuarios/*" "HTTPS / REST"
        sportCourt.apiGateway.forwardingProxy -> sportCourt.msCourts.canchasApi "Reenvía /canchas/*" "HTTPS / REST"
        sportCourt.apiGateway.forwardingProxy -> sportCourt.msCourts.deportesApi "Reenvía /deportes/*" "HTTPS / REST"
        sportCourt.apiGateway.forwardingProxy -> sportCourt.msCourts.horariosApi "Reenvía /horarios-atencion/*" "HTTPS / REST"
        sportCourt.apiGateway.forwardingProxy -> sportCourt.msReservations.reservasApi "Reenvía /reservas/*" "HTTPS / REST"
        sportCourt.apiGateway.forwardingProxy -> sportCourt.msReports.reportesApi "Reenvía /reportes/*" "HTTPS / REST"
    }

    views {
        systemContext sportCourt "Diagram1" {
            include *
        }

        container sportCourt "Diagram2" {
            include *
            autolayout lr
        }

        component sportCourt.msUsers "ComponentesMsUsuarios" "Componentes internos de Ms Usuarios" {
            include *
            autolayout tb
        }

        component sportCourt.msCourts "ComponentesMsCanchas" "Componentes internos de Ms Canchas" {
            include *
            autolayout tb
        }

        component sportCourt.msReservations "ComponentesMsReservas" "Componentes internos de Ms Reservas" {
            include *
            autolayout tb
        }

        component sportCourt.msReports "ComponentesMsReportes" "Componentes internos de Ms Reportes" {
            include *
            autolayout tb
        }

        component sportCourt.shell "ComponentesShell" "Componentes internos del Shell/Host" {
            include *
            autolayout tb
        }

        component sportCourt.mfReservation "ComponentesMfReservas" "Componentes internos de Mf Reservas" {
            include *
            autolayout tb
        }

        component sportCourt.mfAdmin "ComponentesMfAdmin" "Componentes internos de Mf Admin" {
            include *
            autolayout tb
        }

        component sportCourt.mfReports "ComponentesMfReportes" "Componentes internos de Mf Reportes (diseño objetivo)" {
            include *
            autolayout tb
        }

        component sportCourt.apiGateway "ComponentesApiGateway" "Componentes internos del Api Gateway (diseño objetivo)" {
            include *
            autolayout tb
        }

        styles {
            element "Element" {
                color #f8289c
                stroke #f8289c
                strokeWidth 7
                shape roundedbox
            }
            element "Person" {
                shape person
            }
            element "Database" {
                shape cylinder
            }
            element "Boundary" {
                strokeWidth 5
            }
            relationship "Relationship" {
                thickness 4
            }
        }
    }

    configuration {
        scope softwaresystem
    }

}
